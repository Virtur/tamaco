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

async function testDeleteTask() {
  console.log('🧪 Тестирование удаления задачи\n');
  
  // 1. Получаем токен
  if (!await getToken()) return;
  
  try {
    // 2. Создаем тестовую задачу
    console.log('1. Создаем тестовую задачу...');
    const createResponse = await axios.post(`${API_BASE_URL}/tasks`, {
      title_ru: 'Задача для теста удаления',
      description: 'Эта задача будет удалена',
      difficulty: 3,
      tags: [1]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const taskId = createResponse.data.data.id;
    console.log(`✅ Задача создана с ID: ${taskId}`);
    
    // 3. Проверяем что задача существует
    console.log('\n2. Проверяем что задача существует...');
    const getResponse = await axios.get(`${API_BASE_URL}/tasks/${taskId}`);
    console.log(`✅ Задача найдена: "${getResponse.data.data.title_ru}"`);
    
    // 4. Удаляем задачу
    console.log('\n3. Удаляем задачу...');
    const deleteResponse = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Ответ от сервера:');
    console.log('   Успех:', deleteResponse.data.success);
    console.log('   Сообщение:', deleteResponse.data.message);
    
    // 5. Проверяем что задача удалена
    console.log('\n4. Проверяем что задача удалена...');
    try {
      await axios.get(`${API_BASE_URL}/tasks/${taskId}`);
      console.log('❌ ОШИБКА: Задача все еще существует!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Задача успешно удалена (404 Not Found)');
      } else {
        console.log('⚠ Неожиданная ошибка:', error.message);
      }
    }
    
    // 6. Тест удаления несуществующей задачи
    console.log('\n5. Тест удаления несуществующей задачи...');
    try {
      await axios.delete(`${API_BASE_URL}/tasks/999999`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ ОШИБКА: Несуществующая задача удалена!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Ожидаемая ошибка 404 для несуществующей задачи');
      } else {
        console.log('⚠ Другая ошибка:', error.response?.data?.error);
      }
    }
    
    // 7. Тест удаления без авторизации
    console.log('\n6. Тест удаления без авторизации...');
    try {
      // Создаем еще одну задачу
      const createResponse2 = await axios.post(`${API_BASE_URL}/tasks`, {
        title_ru: 'Задача для теста без авторизации',
        difficulty: 5
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const taskId2 = createResponse2.data.data.id;
      
      // Пробуем удалить без токена
      await axios.delete(`${API_BASE_URL}/tasks/${taskId2}`);
      console.log('❌ ОШИБКА: Удаление без токена сработало!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Ожидаемая ошибка 401 без авторизации');
      } else {
        console.log('⚠ Другая ошибка:', error.response?.status);
      }
    }
    
    console.log('\n🎉 Все тесты удаления завершены!');
    
  } catch (error) {
    console.error('\n❌ Ошибка тестирования:');
    console.log('Сообщение:', error.response?.data?.error || error.message);
    
    if (error.response) {
      console.log('Статус:', error.response.status);
      console.log('URL:', error.response.config?.url);
      console.log('Метод:', error.response.config?.method);
      console.log('Данные:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Запускаем тест
testDeleteTask();