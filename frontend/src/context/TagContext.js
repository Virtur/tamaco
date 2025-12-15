import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';

// URL API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 1. Создаем контекст ([хранилище для данных, которые будем передавать по всему приложению через useContext])
const TagContext = createContext();

// 2. Создаем Provider (функция помещения данных в хранилище (Context))
export const TagProvider = ({ children }) => { // children - это ВСЁ приложение, которое нужно обернуть в контекст, оборачивать будем в App.js
  // Состояния для хранения данных
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

// 3. Функция для загрузки всех тегов
  const fetchTags = useCallback(async () => {

    // Не начинаем новую загрузку тегов, если уже загружается
    if (loading) {
      console.log('Загрузка уже идет, пропускаем');
      return;
    }
    console.log('🔄 Загрузка тегов...');
    
    // патерн для обработки асинхронных операций
    setLoading(true); // показать спиннер (загрузку)
    setError(null); // сбросить ошибки
    
    try {
      // получаем данные
      const response = await axios.get(`${API_URL}/tags`);
      console.log(response.data.success , response.data);
      // записываем данные в массив состояния
      if (response.data.success) {
        console.log(`✅ Загружено ${response.data.tag?.length || 0} тегов`); // отладка
        setTags(response.data.tags || []);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка загрузки тегов';
      setError(errorMsg);
      console.error('Ошибка загрузки тегов:', err);
    } finally {
      setLoading(false); // скрыть спиннер загрузки
    }
  }, 
  []); // Пустой массив зависимостей для useCallback

  // 4. Функция для загрузки одного тега по ID
  const fetchTagById = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/tags/${id}`);
      
      if (response.data.success) {
        setSelectedTag(response.data.data);
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка загрузки тега';
      setError(errorMsg);
      console.error('Ошибка загрузки тега:', err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Функция для создания тега
  const createTag = async (tagData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/tags`, tagData);
      
      if (response.data.success) {
        // После создания перезагружаем список
        await fetchTags();
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка создания тега';
      setError(errorMsg);
      console.error('Ошибка создания тега:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 6. Функция для обновления тега
  const updateTag = async (id, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`${API_URL}/tags/${id}`, updates);
      
      if (response.data.success) {
        // Обновляем выбранную тегау если она редактируется
        if (selectedTag?.id === id) {
          setSelectedTag(response.data.data);
        }
        // Обновляем список тегов
        await fetchTags();
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка обновления тега';
      setError(errorMsg);
      console.error('Ошибка обновления тега:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 7. Функция для удаления тега
  const deleteTag = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.delete(`${API_URL}/tags/${id}`);
      
      if (response.data.success) {
        // Удаляем из локального состояния
        setTags(tags.filter(tag => tag.id !== id));
        // Сбрасываем выбранную тегау если она удалена
        if (selectedTag?.id === id) {
          setSelectedTag(null);
        }
        return true;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка удаления тега';
      setError(errorMsg);
      console.error('Ошибка удаления тега:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 8. Функция для фильтрации тегов
  const filterTags = async (filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/tags/filter/by-difficulty`, {
        params: filters
      });
      
      if (response.data.success) {
        setTags(response.data.data || []);
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка фильтрации';
      setError(errorMsg);
      console.error('Ошибка фильтрации:', err);
    } finally {
      setLoading(false);
    }
  };

  // 9. Все данные и функции, которые будут доступны через контекст
  const value = {
    // Данные
    tags,
    selectedTag,
    loading,
    error,
    
    // Функции (методы)
    fetchTags,
    fetchTagById,
    createTag,
    updateTag,
    deleteTag,
    filterTags,
    
    // Сеттеры для состояний
    setSelectedTag,
    setError: (msg) => setError(msg),
    clearError: () => setError(null),
  };

  // 10. При первой загрузке получаем тег (только для тестирования)
  // useEffect(() => {
  //   fetchTags();
  // }, [fetchTags]);

  // 11. Возвращаем провайдер с данными
  // TagContext.Provider делает данные доступными для ЛЮБОГО компонента внутри {children}, в нашем случае {children} все приложение 
  return (
    <TagContext.Provider value={value}>
      {children}
    </TagContext.Provider>
  );
};

// 12. Создаем кастомный хук для удобства использования
export const useTags = () => {
  const context = useContext(TagContext);
  
  if (!context) {
    throw new Error('useTags должен использоваться внутри TagProvider');
  }
  
  return context;
};

// 13. Экспортируем контекст (на случай если понадобится напрямую)
export default TagContext;