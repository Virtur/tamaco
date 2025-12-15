require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testAuth() {
  console.log('🧪 Тестирование системы аутентификации\n');
  
  let token = '';
  
  try {
    // 1. Тест входа с правильными данными
    console.log('1. 🔐 Тест входа (login):');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    console.log('   Статус:', loginResponse.data.success ? '✅' : '❌');
    console.log('   Сообщение:', loginResponse.data.message);
    console.log('   Пользователь:', loginResponse.data.user.login);
    console.log('   Роль:', loginResponse.data.user.role);
    
    token = loginResponse.data.token;
    
    // 2. Тест получения информации о себе
    console.log('\n2. 👤 Тест /auth/me:');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   Статус:', meResponse.data.success ? '✅' : '❌');
    console.log('   Пользователь:', meResponse.data.user.login);
    
    // 3. Тест создания задачи (требует админа)
    console.log('\n3. 📝 Тест создания задачи (защищенный маршрут):');
    try {
      const taskResponse = await axios.post(`${API_URL}/tasks`, {
        title_ru: 'Тестовая задача через API',
        description: 'Описание тестовой задачи',
        difficulty: 5
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('   Статус:', taskResponse.data.success ? '✅' : '❌');
      console.log('   ID созданной задачи:', taskResponse.data.data?.id);
    } catch (error) {
      console.log('   Ошибка (ожидаемо без токена):', error.response?.data?.error || error.message);
    }
    
    // 4. Тест без токена (должна быть ошибка)
    console.log('\n4. 🚫 Тест без токена:');
    try {
      const noTokenResponse = await axios.post(`${API_URL}/tasks`, {
        title_ru: 'Задача без авторизации'
      });
      console.log('   ❌ Не должно было сработать!');
    } catch (error) {
      console.log('   ✅ Ожидаемая ошибка:', error.response?.data?.error || 'Нет доступа');
    }
    
    // 5. Тест с неверным токеном
    console.log('\n5. 🚫 Тест с неверным токеном:');
    try {
      const badTokenResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: 'Bearer invalid_token_123' }
      });
      console.log('   ❌ Не должно было сработать!');
    } catch (error) {
      console.log('   ✅ Ожидаемая ошибка:', error.response?.data?.error || 'Неверный токен');
    }
    
    console.log('\n🎉 Все тесты завершены!');
    
  } catch (error) {
    console.error('\n❌ Критическая ошибка тестирования:');
    console.error('   Сообщение:', error.message);
    if (error.response) {
      console.error('   Статус:', error.response.status);
      console.error('   Данные:', error.response.data);
    }
  }
}

// Запуск теста
testAuth();