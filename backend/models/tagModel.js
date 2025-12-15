const pool = require('../config/db');

const tagModel = {
  // Получить все теги
  getAllTags: async () => {
    try {
      const [tags] = await pool.query(
        'SELECT * FROM tags ORDER BY name ASC'
      );
      return tags;
    } catch (error) {
      console.error('Ошибка при получении тегов:', error);
      throw error;
    }
  },

  // Получить тег по ID
  getTagById: async (tagId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM tags WHERE id = ?',
        [tagId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Ошибка при получении тега:', error);
      throw error;
    }
  },

  // Создать тег
  createTag: async (tagName) => {
    try {
      if (!tagName || tagName.trim() === '') {
        throw new Error('Название тега обязательно');
      }

      const name = tagName.trim();
      
      // Проверяем на дубликат
      const existingTag = await tagModel.findTagByName(name);
      if (existingTag) {
        throw new Error('Тег с таким названием уже существует');
      }

      const [result] = await pool.query(
        'INSERT INTO tags (name) VALUES (?)',
        [name]
      );
      return await tagModel.getTagById(result.insertId);
      // return {
      //   id: result.insertId,
      //   name,
      //   message: 'Тег успешно создан'
      // };
    } catch (error) {
      console.error('Ошибка при создании тега:', error);
      throw error;
    }
  },

  // Найти тег по названию
  findTagByName: async (name) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM tags WHERE name = ?',
        [name]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Ошибка при поиске тега:', error);
      throw error;
    }
  },

  // Обновить тег
  updateTag: async (tagId, newName) => {
    try {
      if (!newName || newName.trim() === '') {
        throw new Error('Новое название тега обязательно');
      }

      const name = newName.trim();
      
      // Проверяем, не существует ли уже тег с таким названием
      const existingTag = await tagModel.findTagByName(name);
      if (existingTag && existingTag.id !== tagId) {
        throw new Error('Тег с таким названием уже существует');
      }

      const [result] = await pool.query(
        'UPDATE tags SET name = ? WHERE id = ?',
        [name, tagId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Тег не найден');
      }

      return {
        success: true,
        message: 'Тег успешно обновлен'
      };
    } catch (error) {
      console.error('Ошибка при обновлении тега:', error);
      throw error;
    }
  },

  // Удалить тег
  deleteTag: async (tagId) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Проверяем, используется ли тег
      const [[usage]] = await connection.query(
        'SELECT COUNT(*) as count FROM task_tags WHERE tag_id = ?',
        [tagId]
      );

      if (usage.count > 0) {
        throw new Error('Тег используется в задачах. Сначала удалите связи.');
      }

      // Удаляем тег
      const [result] = await connection.query(
        'DELETE FROM tags WHERE id = ?',
        [tagId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Тег не найден');
      }

      await connection.commit();
      connection.release();

      return {
        success: true,
        message: 'Тег успешно удален'
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  // Получить теги для задачи
  getTagsForTask: async (taskId) => {
    try {
      const [tags] = await pool.query(`
        SELECT t.* 
        FROM tags t
        JOIN task_tags tt ON t.id = tt.tag_id
        WHERE tt.task_id = ?
        ORDER BY t.name
      `, [taskId]);
      
      return tags;
    } catch (error) {
      console.error('Ошибка при получении тегов задачи:', error);
      throw error;
    }
  },

  // Поиск тегов по названию (для автодополнения)
  searchTags: async (searchTerm, limit = 10) => {
    try {
      const [tags] = await pool.query(
        'SELECT * FROM tags WHERE name LIKE ? ORDER BY name LIMIT ?',
        [`%${searchTerm}%`, limit]
      );
      return tags;
    } catch (error) {
      console.error('Ошибка при поиске тегов:', error);
      throw error;
    }
  },

  // Получить статистику по тегам (сколько задач у каждого тега)
  getTagsWithStats: async () => {
    try {
      const [stats] = await pool.query(`
        SELECT 
          t.id,
          t.name,
          COUNT(tt.task_id) as task_count
        FROM tags t
        LEFT JOIN task_tags tt ON t.id = tt.tag_id
        GROUP BY t.id
        ORDER BY task_count DESC, t.name
      `);
      
      return stats;
    } catch (error) {
      console.error('Ошибка при получении статистики тегов:', error);
      throw error;
    }
  }
};

module.exports = tagModel;