const jwt = require('jsonwebtoken');
const { userModel } = require('../models');

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Требуется авторизация. Токен не предоставлен.' 
      });
    }
    
    // Верифицируем токен
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error('Ошибка верификации токена:', err.message);
        return res.status(403).json({ 
          success: false,
          error: 'Неверный или просроченный токен' 
        });
      }
      
      // Проверяем, существует ли пользователь в базе
      try {
        const user = await userModel.findById(decoded.id);
        if (!user) {
          return res.status(403).json({ 
            success: false,
            error: 'Пользователь не найден' 
          });
        }
        
        // Добавляем информацию о пользователе в запрос
        req.user = {
          id: user.id,
          login: user.login,
          role: user.role
        };
        
        next();
      } catch (dbError) {
        console.error('Ошибка при проверке пользователя:', dbError);
        return res.status(500).json({ 
          success: false,
          error: 'Ошибка сервера при проверке авторизации' 
        });
      }
    });
  } catch (error) {
    console.error('Ошибка в middleware authenticateToken:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
};

// Middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Требуется авторизация' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Доступ запрещен. Требуются права администратора.' 
    });
  }
  
  next();
};

// Middleware для проверки роли (любая из указанных)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Требуется авторизация' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: `Доступ запрещен. Требуются роли: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};

// Middleware для логирования запросов (опционально)
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const userInfo = req.user ? `[${req.user.role}] ${req.user.login}` : '[Неавторизованный]';
  
  console.log(`${timestamp} ${userInfo} ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireRole,
  logRequest
};