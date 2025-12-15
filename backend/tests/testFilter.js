// testFilter.js
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testFilter() {
  console.log('🧪 Тестирование фильтрации задач\n');
  
  const testCases = [
    {
      name: 'Только сложность',
      params: { min: 3, max: 7 }
    },
    {
      name: 'Сложность и один тег',
      params: { min: 1, max: 5, tags: '1' }
    },
    {
      name: 'Сложность и несколько тегов',
      params: { min: 2, max: 8, tags: '1,2,3' }
    },
    {
      name: 'Только теги',
      params: { tags: '2,3' }
    },
    {
      name: 'Без параметров',
      params: {}
    },
    {
      name: 'Некорректные теги',
      params: { min: 1, max: 10, tags: 'abc,xyz' }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📌 Тест: ${testCase.name}`);
    console.log('📤 Параметры:', testCase.params);
    
    try {
      const response = await axios.get(`${API_URL}/tasks/filter/by-difficulty`, {
        params: testCase.params
      });
      
      console.log('✅ Успешно');
      console.log('📥 Ответ:', {
        success: response.data.success,
        count: response.data.count,
        filters: response.data.filters
      });
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('📋 Пример задачи:', {
          id: response.data.data[0].id,
          title: response.data.data[0].title_ru,
          difficulty: response.data.data[0].difficulty,
          tags: response.data.data[0].tags
        });
      }
      
    } catch (error) {
      console.log('❌ Ошибка:', error.message);
      if (error.response) {
        console.log('📊 Статус:', error.response.status);
        console.log('📊 Ответ:', error.response.data);
      }
    }
    
    console.log('─'.repeat(50));
  }
}

// Запуск теста
testFilter().catch(console.error);