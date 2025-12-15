// models/userModel.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const userModel = {
  // Найти пользователя по логину
  findByLogin: async (login) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE login = ?',
        [login]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Ошибка при поиске пользователя:', error);
      throw error;
    }
  },

  // Найти пользователя по ID (без пароля)
  findById: async (id) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, login, role, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Ошибка при поиске пользователя по ID:', error);
      throw error;
    }
  },

  // Создать нового пользователя (с хешированием пароля)
  createUser: async (userData) => {
    const { login, password, role = 'user' } = userData;
    
    try {
      // Проверяем, существует ли пользователь
      const existingUser = await userModel.findByLogin(login);
      if (existingUser) {
        throw new Error('Пользователь с таким логином уже существует');
      }

      // Хешируем пароль с солью
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Вставляем пользователя
      const [result] = await pool.query(
        'INSERT INTO users (login, password_hash, role) VALUES (?, ?, ?)',
        [login, passwordHash, role]
      );

      return {
        id: result.insertId,
        login,
        role,
        message: 'Пользователь успешно создан'
      };
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      throw error;
    }
  },

  // Проверить пароль
  verifyPassword: async (plainPassword, hashedPassword) => {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Ошибка при проверке пароля:', error);
      throw error;
    }
  },

  // Обновить пароль пользователя
  updatePassword: async (userId, newPassword) => {
    try {
      // Хешируем новый пароль
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      const [result] = await pool.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Пользователь не найден');
      }

      return {
        success: true,
        message: 'Пароль успешно обновлен'
      };
    } catch (error) {
      console.error('Ошибка при обновлении пароля:', error);
      throw error;
    }
  },

  // Получить всех пользователей (без паролей)
  getAllUsers: async (page = 1, limit = 20) => {
    try {
      const offset = (page - 1) * limit;
      
      const [users] = await pool.query(
        `SELECT id, login, role, created_at 
         FROM users 
         ORDER BY id DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      
      const [[{ total }]] = await pool.query(
        'SELECT COUNT(*) as total FROM users'
      );
      
      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Ошибка при получении пользователей:', error);
      throw error;
    }
  },

  // Обновить роль пользователя
  updateUserRole: async (userId, newRole) => {
    try {
      const validRoles = ['admin', 'user'];
      if (!validRoles.includes(newRole)) {
        throw new Error('Недопустимая роль');
      }

      const [result] = await pool.query(
        'UPDATE users SET role = ? WHERE id = ?',
        [newRole, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Пользователь не найден');
      }

      return {
        success: true,
        message: `Роль пользователя обновлена на "${newRole}"`
      };
    } catch (error) {
      console.error('Ошибка при обновлении роли:', error);
      throw error;
    }
  },

  // Удалить пользователя
  deleteUser: async (userId) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Нельзя удалить последнего администратора
      const [[adminCount]] = await connection.query(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
      );

      const [[user]] = await connection.query(
        'SELECT role FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      if (user.role === 'admin' && adminCount.count <= 1) {
        throw new Error('Нельзя удалить последнего администратора');
      }

      // Удаляем пользователя
      await connection.query(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      await connection.commit();
      connection.release();

      return {
        success: true,
        message: 'Пользователь удален'
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }
};

module.exports = userModel;
