const express = require('express');
const router = express.Router();
const taskModel = require('../models/taskModel');
const { authenticateToken, requireAdmin } = require('../middleware/auth'); // аутентификация через токен (сторонний сервис)

// ==================== CRUD ОПЕРАЦИИ ====================

// GET /api/tasks - Получить все задачи с пагинацией
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    console.log(`📥 Получение задач: страница ${page}, лимит ${limit}`);
    
    const result = await taskModel.getAllTasks(page, limit);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Ошибка получения задач:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось получить задачи',
      message: error.message 
    });
  }
});

// GET /api/tasks/:id - Получить задачу по ID
router.get('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID задачи' 
      });
    }
    
    console.log(`📥 Получение задачи с ID: ${taskId}`);
    
    const task = await taskModel.getTaskById(taskId);
    
    if (!task) {
      return res.status(404).json({ 
        success: false,
        error: 'Задача не найдена' 
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Ошибка получения задачи:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось получить задачу',
      message: error.message 
    });
  }
});

// POST /api/tasks - Создать новую задачу
router.post('/', async (req, res) => {
  try {
    console.log('📝 Создание новой задачи:', req.body);
    
    // Валидация обязательных полей
    if (!req.body.title_ru || req.body.title_ru.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Название задачи обязательно' 
      });
    }
    
    if (req.body.difficulty && (req.body.difficulty < 1 || req.body.difficulty > 10)) {
      return res.status(400).json({ 
        success: false,
        error: 'Сложность должна быть от 1 до 10' 
      });
    }
    
    const taskData = {
      title_ru: req.body.title_ru.trim(),
      description: req.body.description || '',
      solution_idea: req.body.solution_idea || '',
      polygon_url: req.body.polygon_url || '',
      difficulty: req.body.difficulty || 5,
      note: req.body.note || '',
      tags: req.body.tags || [],
      contests: req.body.contests || []
    };
    
    const newTask = await taskModel.createTask(taskData);
    
    console.log('✅ Задача создана с ID:', newTask.id);
    
    res.status(201).json({
      success: true,
      message: 'Задача успешно создана',
      data: newTask
    });
  } catch (error) {
    console.error('❌ Ошибка создания задачи:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось создать задачу',
      message: error.message 
    });
  }
});

// PUT /api/tasks/:id - Обновить задачу
router.put('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID задачи' 
      });
    }
    
    console.log(`✏️ Обновление задачи ID: ${taskId}`, req.body);
    
    // Проверяем существование задачи
    const existingTask = await taskModel.getTaskById(taskId);
    if (!existingTask) {
      return res.status(404).json({ 
        success: false,
        error: 'Задача не найдена' 
      });
    }
    
    // Валидация
    if (req.body.difficulty && (req.body.difficulty < 1 || req.body.difficulty > 10)) {
      return res.status(400).json({ 
        success: false,
        error: 'Сложность должна быть от 1 до 10' 
      });
    }
    
    const updatedTask = await taskModel.updateTask(taskId, req.body);
    
    res.json({
      success: true,
      message: 'Задача успешно обновлена',
      data: updatedTask
    });
  } catch (error) {
    console.error('❌ Ошибка обновления задачи:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось обновить задачу',
      message: error.message 
    });
  }
});

// PATCH /api/tasks/:id - Обновить задачу (частично)
router.patch('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID задачи' 
      });
    }
    
    console.log(`✏️ Обновление задачи ID: ${taskId}`, req.body);
    
    // Проверяем существование задачи
    const existingTask = await taskModel.getTaskById(taskId);
    if (!existingTask) {
      return res.status(404).json({ 
        success: false,
        error: 'Задача не найдена' 
      });
    }
    
    // Валидация
    if (req.body.difficulty && (req.body.difficulty < 1 || req.body.difficulty > 10)) {
      return res.status(400).json({ 
        success: false,
        error: 'Сложность должна быть от 1 до 10' 
      });
    }
    
    const updatedTask = await taskModel.patchTask(taskId, req.body);
    
    res.json({
      success: true,
      message: 'Задача успешно обновлена',
      data: updatedTask
    });
  } catch (error) {
    console.error('❌ Ошибка обновления задачи:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось обновить задачу',
      message: error.message 
    });
  }
});

// DELETE /api/tasks/:id - Удалить задачу
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID задачи' 
      });
    }
    
    console.log(`🗑️ Удаление задачи ID: ${taskId}`);
    
    // Проверяем существование задачи
    const existingTask = await taskModel.getTaskById(taskId);
    if (!existingTask) {
      return res.status(404).json({ 
        success: false,
        error: 'Задача не найдена' 
      });
    }
    
    await taskModel.deleteTask(taskId);
    
    res.json({
      success: true,
      message: 'Задача успешно удалена'
    });
  } catch (error) {
    console.error('❌ Ошибка удаления задачи:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось удалить задачу',
      message: error.message 
    });
  }
});

// ==================== СПЕЦИАЛЬНЫЕ МАРШРУТЫ ====================

// GET /api/tasks/filter/by-difficulty - Фильтрация по сложности и тегам
router.get('/filter/by-difficulty', async (req, res) => {
  try {
    const minDifficulty = parseInt(req.query.min) || 1;
    const maxDifficulty = parseInt(req.query.max) || 10;
    
    let tagIds = [];
    if (req.query.tags) {
      if (Array.isArray(req.query.tags)) {
        tagIds = req.query.tags.map(id => parseInt(id)).filter(id => !isNaN(id));
      } else if (typeof req.query.tags === 'string') {
        tagIds = req.query.tags.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      }
    }
    
    console.log(`🔍 Фильтрация: сложность ${minDifficulty}-${maxDifficulty}, теги:`, tagIds);
    
    const filteredTasks = await taskModel.filterTasks(minDifficulty, maxDifficulty, tagIds);
    
    res.json({
      success: true,
      filters: {
        minDifficulty,
        maxDifficulty,
        tagIds,
        tagCount: tagIds.length
      },
      count: filteredTasks.length,
      data: filteredTasks
    });
  } catch (error) {
    console.error('❌ Ошибка фильтрации задач:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось отфильтровать задачи',
      message: error.message 
    });
  }
});

// GET /api/tasks/search - Поиск задач по названию
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    if (searchTerm.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Поисковый запрос не может быть пустым' 
      });
    }
    
    console.log(`🔎 Поиск задач: "${searchTerm}"`);
    
    const result = await taskModel.searchTasks(searchTerm, page, limit);
    
    res.json({
      success: true,
      searchTerm,
      ...result
    });
  } catch (error) {
    console.error('❌ Ошибка поиска задач:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось выполнить поиск',
      message: error.message 
    });
  }
});

// GET /api/tasks/stats - Статистика по задачам
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('📊 Получение статистики по задачам');
    
    const stats = await taskModel.getTasksStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Ошибка получения статистики:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось получить статистику',
      message: error.message 
    });
  }
});

// GET /api/tasks/by-tag/:tagId - Получить задачи по тегу
router.get('/by-tag/:tagId', async (req, res) => {
  try {
    const tagId = parseInt(req.params.tagId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    if (isNaN(tagId) || tagId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID тега' 
      });
    }
    
    console.log(`🏷️ Получение задач для тега ID: ${tagId}`);
    
    const result = await taskModel.getTasksByTag(tagId, page, limit);
    
    res.json({
      success: true,
      tagId,
      ...result
    });
  } catch (error) {
    console.error('❌ Ошибка получения задач по тегу:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось получить задачи по тегу',
      message: error.message 
    });
  }
});

// GET /api/tasks/by-contest/:contestId - Получить задачи по контесту
router.get('/by-contest/:contestId', async (req, res) => {
  try {
    const contestId = parseInt(req.params.contestId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    if (isNaN(contestId) || contestId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID контеста' 
      });
    }
    
    console.log(`🏆 Получение задач для контеста ID: ${contestId}`);
    
    const result = await taskModel.getTasksByContest(contestId, page, limit);
    
    res.json({
      success: true,
      contestId,
      ...result
    });
  } catch (error) {
    console.error('❌ Ошибка получения задач по контесту:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось получить задачи по контесту',
      message: error.message 
    });
  }
});

module.exports = router;