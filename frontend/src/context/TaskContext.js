import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

// URL API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 1. Создаем контекст ([хранилище для данных, которые будем передавать по всему приложению через useContext])
const TaskContext = createContext();

// 2. Создаем Provider (функция помещения данных в хранилище (Context))
export const TaskProvider = ({ children }) => { // children - это ВСЁ приложение, которое нужно обернуть в контекст, оборачивать будем в App.js
  // Состояния для хранения данных
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  // 3. Функция для загрузки всех задач
  const fetchTasks = useCallback(async (page = 1, limit = 20) => {

    // Не начинаем новую загрузку задач, если уже загружается
    if (loading) {
      console.log('Загрузка уже идет, пропускаем');
      return;
    }
    console.log('🔄 Загрузка задач...');
    
    // патерн для обработки асинхронных операций
    setLoading(true); // показать спиннер (загрузку)
    setError(null); // сбросить ошибки
    
    try {
      // получаем данные
      const response = await axios.get(`${API_URL}/tasks`, {
        params: { page, limit }
      });
       console.log(response.data.success);
      // записываем данные в массив состояния
      if (response.data.success) {
        console.log(`✅ Загружено ${response.data.tasks?.length || 0} задач`); // отладка
        setTasks(response.data.tasks || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка загрузки задач';
      setError(errorMsg);
      console.error('Ошибка загрузки задач:', err);
    } finally {
      setLoading(false); // скрыть спиннер загрузки
    }
  },[]); // Пустой массив зависимостей для useCallback

  // 4. Функция для загрузки одной задачи по ID
  const fetchTaskById = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/tasks/${id}`);
      
      if (response.data.success) {
        setSelectedTask(response.data.data);
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка загрузки задачи';
      setError(errorMsg);
      console.error('Ошибка загрузки задачи:', err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Функция для создания задачи
  const createTask = async (taskData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/tasks`, taskData);
      
      if (response.data.success) {
        // После создания перезагружаем список
        await fetchTasks(pagination.page, pagination.limit);
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка создания задачи';
      setError(errorMsg);
      console.error('Ошибка создания задачи:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 6. Функция для обновления задачи
  const updateTask = async (id, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`${API_URL}/tasks/${id}`, updates);
      
      if (response.data.success) {
        // Обновляем выбранную задачу если она редактируется
        if (selectedTask?.id === id) {
          setSelectedTask(response.data.data);
        }
        // Обновляем список задач
        await fetchTasks(pagination.page, pagination.limit);
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка обновления задачи';
      setError(errorMsg);
      console.error('Ошибка обновления задачи:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 7. Функция для удаления задачи
  const deleteTask = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.delete(`${API_URL}/tasks/${id}`);
      
      if (response.data.success) {
        // Удаляем из локального состояния
        setTasks(tasks.filter(task => task.id !== id));
        // Сбрасываем выбранную задачу если она удалена
        if (selectedTask?.id === id) {
          setSelectedTask(null);
        }
        return true;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка удаления задачи';
      setError(errorMsg);
      console.error('Ошибка удаления задачи:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 8. Функция для фильтрации задач
  const filterTasks = useCallback(async (filters) => {
    setLoading(true);
    setError(null);
    
    console.log('🎯 Применение фильтров:', filters);
    
    try {
      const response = await axios.get(`${API_URL}/tasks/filter/by-difficulty`, {
        params: filters
      });
      
      console.log('📥 Ответ от сервера:', response.data);
      
      if (response.data.success) {
        setTasks(response.data.data || []);
        return response.data.data;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка фильтрации';
      setError(errorMsg);
      console.error('Ошибка фильтрации:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 9. Все данные и функции, которые будут доступны через контекст
  const value = {
    // Данные
    tasks,
    selectedTask,
    loading,
    error,
    pagination,
    
    // Функции (методы)
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    filterTasks,
    
    // Сеттеры для состояний
    setSelectedTask,
    setError: (msg) => setError(msg),
    clearError: () => setError(null),
  };

  // 10. При первой загрузке получаем задачи (только для тестирования)
  // useEffect(() => {
  //   fetchTasks();
  // }, [fetchTasks]);

  // 11. Возвращаем провайдер с данными
  // TaskContext.Provider делает данные доступными для ЛЮБОГО компонента внутри {children}, в нашем случае {children} все приложение 
  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

// 12. Создаем кастомный хук для удобства использования (! не использовать - нужна отладка)
export const useTasks = () => {
  const context = useContext(TaskContext);
  
  if (!context) {
    throw new Error('useTasks должен использоваться внутри TaskProvider');
  }
  
  return context;
};

// 13. Экспортируем контекст (на случай если понадобится напрямую)
export default TaskContext;