const express = require('express');
const router = express.Router();
const tagModel = require('../models/tagModel');
const { authenticateToken, requireAdmin } = require('../middleware/auth'); // аутентификация через токен (сторонний сервис)
const pool = require('../config/db');


// Получить все теги
router.get('/', async (req, res) => {
  try {
    console.log(`📥 Получение тегов`);
    const tags = await tagModel.getAllTags();
    res.json({
      success: true,
      tags});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tags/:id - Получить тег по ID
router.get('/:id', async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);
    
    if (isNaN(tagId) || tagId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID тега' 
      });
    }
    
    console.log(`📥 Получение тега с ID: ${tagId}`);
    
    const tag = await tagModel.getTagById(tagId);
    
    if (!tag) {
      return res.status(404).json({ 
        success: false,
        error: 'Тег не найден' 
      });
    }
    
    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('❌ Ошибка получения тегов:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось получить тег',
      message: error.message
    });
  }
});

// Создать тег
router.post('/', async (req, res) => {
  try {
    console.log('📝 Создание нового тега:', req.body);
    
    const { name } = req.body;
    
    // if (!name || name.trim() === '') {
    //   return res.status(400).json({ error: 'Название тега обязательно' });
    // }
    
    // const [result] = await pool.query(
    //   'INSERT INTO tags (name) VALUES (?)',
    //   [name.trim()]
    // );
    const newTag = await tagModel.createTag(name);
    
    console.log('✅ Тег создан с ID:', newTag.id);
    
    res.status(201).json({
      success: true,
      message: 'Тег успешно создан',
      id: result.insertId,
      name: newTag
    });
  } catch (error) {
    console.error('❌ Ошибка создания тега:', error);
    res.status(500).json({ 
      success: false,
      error: 'Не удалось создать тег',
      message: error.message 
    });
  }
});

// Удалить тег
router.delete('/:id', async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);
    
    // Проверяем, используется ли тег в задачах
    const [usage] = await pool.query(
      'SELECT COUNT(*) as count FROM task_tags WHERE tag_id = ?',
      [tagId]
    );
    
    if (usage[0].count > 0) {
      return res.status(400).json({ 
        error: 'Невозможно удалить тег, так как он используется в задачах' 
      });
    }
    
    await pool.query('DELETE FROM tags WHERE id = ?', [tagId]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;