// backend/test-delete-security.js
require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
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

async function testDeleteSecurity() {
  console.log('🔐 Тестирование безопасности удаления задач\n');
  
  // 1. Получаем токен админа
  if (!await getToken()) return;
  
  try {
    // 2. Создаем тестовую задачу
    console.log('1. Создаем тестовую задачу...');
    const createResponse = await axios.post(`${API_BASE_URL}/tasks`, {
      title_ru: 'Задача для теста безопасности',
      description: 'Тестируем защиту удаления',
      difficulty: 3
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const taskId = createResponse.data.data.id;
    console.log(`✅ Задача создана с ID: ${taskId}`);
    
    // 3. Тест 1: Удаление БЕЗ токена (должна быть ошибка 401)
    console.log('\n2. Тест удаления БЕЗ токена...');
    try {
      const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
      // Если сюда попали - ОШИБКА В БЕЗОПАСНОСТИ!
      console.log('❌ КРИТИЧЕСКАЯ УЯЗВИМОСТЬ!');
      console.log('   Запрос прошел без авторизации!');
      console.log('   Статус:', response.status);
      console.log('   Ответ:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Защита работает! Ошибка 401: Требуется авторизация');
        console.log('   Сообщение:', error.response.data.error);
      } else if (error.response?.status === 403) {
        console.log('✅ Защита работает! Ошибка 403: Доступ запрещен');
      } else {
        console.log('⚠ Неожиданная ошибка:', error.response?.status);
        console.log('   Ответ:', error.response?.data);
      }
    }
    
    // 4. Тест 2: Удаление с НЕВЕРНЫМ токеном (должна быть ошибка 403)
    console.log('\n3. Тест удаления с НЕВЕРНЫМ токеном...');
    try {
      const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: 'Bearer invalid_fake_token_123' }
      });
      console.log('❌ КРИТИЧЕСКАЯ УЯЗВИМОСТЬ!');
      console.log('   Неверный токен был принят!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Защита работает! Ошибка 403: Неверный токен');
      } else if (error.response?.status === 401) {
        console.log('✅ Защита работает! Ошибка 401');
      } else {
        console.log('⚠ Другая ошибка:', error.response?.status);
      }
    }
    
    // 5. Тест 3: Удаление с ПРАВИЛЬНЫМ токеном (должно работать)
    console.log('\n4. Тест удаления с ПРАВИЛЬНЫМ токеном...');
    try {
      const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data.success) {
        console.log('✅ Удаление с правильным токеном работает!');
        console.log('   Сообщение:', response.data.message);
        console.log('   Удалил:', response.data.deletedBy || 'admin');
      } else {
        console.log('⚠ Удаление не сработало:', response.data.error);
      }
    } catch (error) {
      console.log('❌ Ошибка при удалении с правильным токеном:');
      console.log('   Статус:', error.response?.status);
      console.log('   Ошибка:', error.response?.data?.error);
    }
    
    // 6. Тест 4: Удаление НЕСУЩЕСТВУЮЩЕЙ задачи
    console.log('\n5. Тест удаления несуществующей задачи...');
    try {
      const response = await axios.delete(`${API_BASE_URL}/tasks/999999`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.status === 404) {
        console.log('✅ Правильная обработка: задача не найдена');
      } else {
        console.log('⚠ Неожиданный статус:', response.status);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Правильная обработка: 404 Not Found');
      } else {
        console.log('⚠ Другая ошибка:', error.response?.status);
      }
    }
    
    // 7. Тест 5: Проверка роли (если есть пользователь user, а не admin)
    console.log('\n6. Проверка ролевой модели...');
    
    // Создаем обычного пользователя (если есть)
    try {
      const userLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        login: 'user',  // попробуй пользователя с ролью 'user'
        password: 'user123'
      });
      
      if (userLoginResponse.data.success && userLoginResponse.data.user.role !== 'admin') {
        const userToken = userLoginResponse.data.token;
        
        // Создаем задачу от имени админа
        const taskResponse = await axios.post(`${API_BASE_URL}/tasks`, {
          title_ru: 'Задача для теста ролей',
          difficulty: 5
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const userTaskId = taskResponse.data.data.id;
        
        // Пробуем удалить от имени обычного пользователя
        try {
          await axios.delete(`${API_BASE_URL}/tasks/${userTaskId}`, {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          console.log('❌ УЯЗВИМОСТЬ: Обычный пользователь удалил задачу!');
        } catch (error) {
          if (error.response?.status === 403) {
            console.log('✅ Ролевая модель работает! Ошибка 403 для обычного пользователя');
          } else {
            console.log('⚠ Другая ошибка для пользователя:', error.response?.status);
          }
        }
        
        // Удаляем задачу от имени админа
        await axios.delete(`${API_BASE_URL}/tasks/${userTaskId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } else {
        console.log('ℹ️ Пользователь с ролью "user" не найден, пропускаем тест ролей');
      }
    } catch (error) {
      console.log('ℹ️ Не удалось проверить ролевую модель:', error.message);
    }
    
    console.log('\n🎉 Тестирование безопасности завершено!');
    
  } catch (error) {
    console.error('\n❌ Общая ошибка тестирования:');
    console.log('Сообщение:', error.response?.data?.error || error.message);
    
    if (error.response) {
      console.log('Статус:', error.response.status);
      console.log('URL:', error.response.config?.url);
    }
  }
}

// Запускаем тест безопасности
testDeleteSecurity();