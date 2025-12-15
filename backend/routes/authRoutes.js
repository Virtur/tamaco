const express = require('express');
const router = express.Router();
//const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//const pool = require('../config/db');
const { userModel } = require('../models'); // для работу через модель данных
const { authenticateToken, requireAdmin } = require('../middleware/auth'); // аутентификация через токен (сторонний сервис)

// ==================== АУТЕНТИФИКАЦИЯ ====================

// POST /api/auth/login - Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    // Валидация входных данных
    if (!login || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Логин и пароль обязательны' 
      });
    }
    
    console.log(`🔐 Попытка входа пользователя: ${login}`);
    
    // Ищем пользователя в базе
    const user = await userModel.findByLogin(login);
    
    if (!user) {
      console.warn(`⚠️  Пользователь не найден: ${login}`);
      return res.status(401).json({ 
        success: false,
        error: 'Неверный логин или пароль' 
      });
    }
    
    // Проверяем пароль
    const validPassword = await userModel.verifyPassword(password, user.password_hash);
    
    if (!validPassword) {
      console.warn(`⚠️  Неверный пароль для пользователя: ${login}`);
      return res.status(401).json({ 
        success: false,
        error: 'Неверный логин или пароль' 
      });
    }
    
    // Создаем JWT токен
    const tokenPayload = {
      id: user.id,
      login: user.login,
      role: user.role
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Успешный вход: ${login} (${user.role})`);
    
    res.json({
      success: true,
      message: 'Авторизация успешна',
      token,
      user: {
        id: user.id,
        login: user.login,
        role: user.role
      },
      expiresIn: 24 * 60 * 60 // 24 часа в секундах
    });
    
  } catch (error) {
    console.error('❌ Ошибка авторизации:', error);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка сервера при авторизации',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/register - Регистрация (только для админа)
router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { login, password, role = 'user' } = req.body;
    
    if (!login || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Логин и пароль обязательны' 
      });
    }
    
    // Валидация роли
    const validRoles = ['admin', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: 'Недопустимая роль. Допустимые значения: admin, user' 
      });
    }
    
    console.log(`👤 Регистрация нового пользователя: ${login} (${role})`);
    
    const result = await userModel.createUser({ login, password, role });
    
    res.status(201).json({
      success: true,
      message: 'Пользователь успешно создан',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Ошибка при создании пользователя'
    });
  }
});

// GET /api/auth/me - Получить информацию о текущем пользователе
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Пользователь уже добавлен в req в middleware authenticateToken
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('❌ Ошибка получения информации о пользователе:', error);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка сервера' 
    });
  }
});

// POST /api/auth/refresh - Обновление токена (опционально)
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Создаем новый токен с теми же данными
    const newToken = jwt.sign(
      {
        id: req.user.id,
        login: req.user.login,
        role: req.user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token: newToken,
      user: req.user,
      expiresIn: 24 * 60 * 60
    });
  } catch (error) {
    console.error('❌ Ошибка обновления токена:', error);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка сервера' 
    });
  }
});

// POST /api/auth/logout - Выход (на клиенте просто удаляем токен)
router.post('/logout', (req, res) => {
  // В JWT нет серверных сессий, просто сообщаем клиенту
  res.json({
    success: true,
    message: 'Успешный выход из системы'
  });
});

// POST /api/auth/change-password - Смена пароля
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Текущий и новый пароль обязательны' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Новый пароль должен быть не менее 6 символов' 
      });
    }
    
    // Получаем пользователя с паролем
    const user = await userModel.findByLogin(req.user.login);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Пользователь не найден' 
      });
    }
    
    // Проверяем текущий пароль
    const validPassword = await userModel.verifyPassword(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Неверный текущий пароль' 
      });
    }
    
    // Обновляем пароль
    await userModel.updatePassword(user.id, newPassword);
    
    console.log(`🔑 Пароль изменен для пользователя: ${user.login}`);
    
    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
    
  } catch (error) {
    console.error('❌ Ошибка смены пароля:', error);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка при смене пароля' 
    });
  }
});

// ==================== АДМИНИСТРИРОВАНИЕ ПОЛЬЗОВАТЕЛЕЙ ====================

// GET /api/auth/users - Получить список пользователей (только для админа)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await userModel.getAllUsers(page, limit);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Ошибка получения списка пользователей:', error);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка при получении пользователей' 
    });
  }
});

// PUT /api/auth/users/:id/role - Изменить роль пользователя (только для админа)
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID пользователя' 
      });
    }
    
    if (!role) {
      return res.status(400).json({ 
        success: false,
        error: 'Роль обязательна' 
      });
    }
    
    // Нельзя изменить роль самого себя
    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false,
        error: 'Нельзя изменить свою собственную роль' 
      });
    }
    
    const result = await userModel.updateUserRole(userId, role);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Ошибка изменения роли:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Ошибка при изменении роли' 
    });
  }
});

// DELETE /api/auth/users/:id - Удалить пользователя (только для админа)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID пользователя' 
      });
    }
    
    // Нельзя удалить самого себя
    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false,
        error: 'Нельзя удалить свой собственный аккаунт' 
      });
    }
    
    const result = await userModel.deleteUser(userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Ошибка удаления пользователя:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Ошибка при удалении пользователя' 
    });
  }
});

module.exports = router;


// ==================== АУТЕНТИФИКАЦИЯ (БЕЗ ИСПОЛЬЗОВАНИЯ МОДЕЛИ) ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ ====================

// // Простой middleware для проверки авторизации
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
  
//   if (!token) {
//     return res.status(401).json({ error: 'Требуется авторизация' });
//   }
  
//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ error: 'Неверный токен' });
//     }
//     req.user = user;
//     next();
//   });
// };

// // Вход в систему
// router.post('/login', async (req, res) => {
//   try {
//     const { login, password } = req.body;
    
//     if (!login || !password) {
//       return res.status(400).json({ 
//         error: 'Логин и пароль обязательны' 
//       });
//     }
    
//     // Ищем пользователя в базе
//     const [users] = await pool.query(
//       'SELECT * FROM users WHERE login = ?',
//       [login]
//     );
    
//     if (users.length === 0) {
//       return res.status(401).json({ 
//         error: 'Неверный логин' 
//       });
//     }
    
//     const user = users[0];
    
//     // Проверяем пароль
//     const validPassword = await bcrypt.compare(password, user.password_hash);
    
//     if (!validPassword) {
//       return res.status(401).json({ 
//         error: 'Неверный пароль' 
//       });
//     }
    
//     // Создаем JWT токен
//     const token = jwt.sign(
//       { 
//         id: user.id, 
//         login: user.login, 
//         role: user.role 
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );
    
//     res.json({
//       success: true,
//       message: 'Авторизация успешна',
//       token,
//       user: {
//         id: user.id,
//         login: user.login,
//         role: user.role
//       }
//     });
    
//   } catch (error) {
//     console.error('Ошибка авторизации:', error);
//     res.status(500).json({ error: 'Ошибка сервера' });
//   }
// });

// // Проверка токена (для фронтенда)
// router.get('/verify', authenticateToken, (req, res) => {
//   res.json({
//     success: true,
//     user: req.user
//   });
// });

// // Создать пользователя (только для админа)
// router.post('/register', async (req, res) => {
//   try {
//     const { login, password, role = 'user' } = req.body;
    
//     if (!login || !password) {
//       return res.status(400).json({ 
//         error: 'Логин и пароль обязательны' 
//       });
//     }
    
//     // Проверяем, существует ли пользователь
//     const [existingUsers] = await pool.query(
//       'SELECT id FROM users WHERE login = ?',
//       [login]
//     );
    
//     if (existingUsers.length > 0) {
//       return res.status(400).json({ 
//         error: 'Пользователь с таким логином уже существует' 
//       });
//     }
    
//     // Хешируем пароль
//     const salt = await bcrypt.genSalt(10);
//     const passwordHash = await bcrypt.hash(password, salt);
    
//     // Создаем пользователя
//     await pool.query(
//       'INSERT INTO users (login, password_hash, role) VALUES (?, ?, ?)',
//       [login, passwordHash, role]
//     );
    
//     res.status(201).json({
//       success: true,
//       message: 'Пользователь создан'
//     });
    
//   } catch (error) {
//     console.error('Ошибка создания пользователя:', error);
//     res.status(500).json({ error: 'Ошибка сервера' });
//   }
// });

// module.exports = { router, authenticateToken };