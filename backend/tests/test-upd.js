require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
let authToken = '';

async function getToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Токен получен');
      return true;
    }
  } catch (error) {
    console.error('❌ Ошибка получения токена:', error.message);
    return false;
  }
}

async function testUpdateTask() {
  console.log('🧪 Тестирование обновления задачи\n');
  
  // 1. Получаем токен
  if (!await getToken()) return;
  
  try {
    // 2. Создаем тестовую задачу
    console.log('1. Создаем тестовую задачу...');
    const createResponse = await axios.post(`${API_BASE_URL}/tasks`, {
      title_ru: 'Задача для теста обновления',
      description: 'Исходное описание',
      difficulty: 3,
      tags: [1]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const taskId = createResponse.data.data.id;
    console.log(`✅ Задача создана с ID: ${taskId}`);
    
    // 3. Обновляем задачу (полное обновление)
    console.log('\n2. Полное обновление задачи...');
    const updateResponse = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, {
      title_ru: 'Обновленное название задачи',
      description: 'Обновленное описание',
      difficulty: 7,
      solution_idea: 'Новая идея решения',
      tags: [1, 2],
      contests: [1]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Задача обновлена:');
    console.log('   Название:', updateResponse.data.data.title_ru);
    console.log('   Сложность:', updateResponse.data.data.difficulty);
    
    // 4. Частичное обновление
    console.log('\n3. Частичное обновление (только сложность)...');
    const patchResponse = await axios.patch(`${API_BASE_URL}/tasks/${taskId}`, {
      difficulty: 9
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Сложность обновлена:', patchResponse.data.data.difficulty);
    
    // 5. Проверяем что задача обновлена
    console.log('\n4. Проверяем обновленную задачу...');
    const getResponse = await axios.get(`${API_BASE_URL}/tasks/${taskId}`);
    
    console.log('✅ Финальное состояние задачи:');
    console.log('   ID:', getResponse.data.data.id);
    console.log('   Название:', getResponse.data.data.title_ru);
    console.log('   Сложность:', getResponse.data.data.difficulty);
    console.log('   Описание:', getResponse.data.data.description?.substring(0, 50) + '...');
    
    // 6. Удаляем тестовую задачу
    console.log('\n5. Удаляем тестовую задачу...');
    await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Тестовая задача удалена');
    console.log('\n🎉 Все тесты обновления прошли успешно!');
    
  } catch (error) {
    console.error('\n❌ Ошибка тестирования:');
    console.log('Сообщение:', error.response?.data?.error || error.message);
    
    if (error.response) {
      console.log('Статус:', error.response.status);
      console.log('Данные:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Запускаем тест
testUpdateTask();