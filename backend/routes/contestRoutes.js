const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const contestModel = require('../models/contestModel');
const { authenticateToken, requireAdmin } = require('../middleware/auth'); // аутентификация через токен (сторонний сервис)

// Получить все контесты
router.get('/', async (req, res) => {
  try {
    console.log(`📥 Получение контестов`);

    const contests = await contestModel.getAllContests();
    res.json({
      success: true,
      contests});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать контест
router.post('/', async (req, res) => {
  try {
    const { name, year } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Название контеста обязательно' });
    }
    
    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ 
        error: 'Год должен быть между 2000 и 2100' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO contests (name, year) VALUES (?, ?)',
      [name.trim(), parseInt(year)]
    );
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      name: name.trim(),
      year: parseInt(year)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;