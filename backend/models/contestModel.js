const pool = require('../config/db');

const contestModel = {
  // Получить все контесты
  getAllContests: async () => {
    try {
      const [contests] = await pool.query(
        `SELECT * FROM contests ORDER BY year DESC, name ASC`
      );
      return contests;
    } catch (error) {
        console.error('Ошибка при получении контестов:', error);
      throw error;
    }
  },

  // Получить контест по ID
  getContestById: async (contestId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM contests WHERE id = ?',
        [contestId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Ошибка при получении контеста:', error);
      throw error;
    }
  },

  // Создать контест
  createContest: async (contestData) => {
    const { name, year } = contestData;
    
    try {
      if (!name || name.trim() === '') {
        throw new Error('Название контеста обязательно');
      }

      if (!year || isNaN(year) || year < 2000 || year > 2100) {
        throw new Error('Год должен быть числом между 2000 и 2100');
      }

      const contestName = name.trim();
      const contestYear = parseInt(year);

      const [result] = await pool.query(
        'INSERT INTO contests (name, year) VALUES (?, ?)',
        [contestName, contestYear]
      );

      return {
        id: result.insertId,
        name: contestName,
        year: contestYear,
        message: 'Контест успешно создан'
      };
    } catch (error) {
      console.error('Ошибка при создании контеста:', error);
      throw error;
    }
  },

  // Обновить контест
  updateContest: async (contestId, contestData) => {
    const { name, year } = contestData;
    
    try {
      const updates = [];
      const values = [];

      if (name !== undefined) {
        if (name.trim() === '') {
          throw new Error('Название контеста не может быть пустым');
        }
        updates.push('name = ?');
        values.push(name.trim());
      }

      if (year !== undefined) {
        if (isNaN(year) || year < 2000 || year > 2100) {
          throw new Error('Год должен быть числом между 2000 и 2100');
        }
        updates.push('year = ?');
        values.push(parseInt(year));
      }

      if (updates.length === 0) {
        throw new Error('Нет данных для обновления');
      }

      values.push(contestId);

      const query = `UPDATE contests SET ${updates.join(', ')} WHERE id = ?`;
      const [result] = await pool.query(query, values);

      if (result.affectedRows === 0) {
        throw new Error('Контест не найден');
      }

      return {
        success: true,
        message: 'Контест успешно обновлен'
      };
    } catch (error) {
      console.error('Ошибка при обновлении контеста:', error);
      throw error;
    }
  },

  // Удалить контест
  deleteContest: async (contestId) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Проверяем, используется ли контест
      const [[usage]] = await connection.query(
        'SELECT COUNT(*) as count FROM task_contests WHERE contest_id = ?',
        [contestId]
      );

      if (usage.count > 0) {
        throw new Error('Контест используется в задачах. Сначала удалите связи.');
      }

      // Удаляем контест
      const [result] = await connection.query(
        'DELETE FROM contests WHERE id = ?',
        [contestId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Контест не найден');
      }

      await connection.commit();
      connection.release();

      return {
        success: true,
        message: 'Контест успешно удален'
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  // Получить задачи контеста
  getContestTasks: async (contestId) => {
    try {
      const [tasks] = await pool.query(`
        SELECT t.* 
        FROM tasks t
        JOIN task_contests tc ON t.id = tc.task_id
        WHERE tc.contest_id = ?
        ORDER BY t.difficulty, t.title_ru
      `, [contestId]);
      
      return tasks;
    } catch (error) {
      console.error('Ошибка при получении задач контеста:', error);
      throw error;
    }
  },

  // Поиск контестов по названию или году
  searchContests: async (searchTerm, limit = 10) => {
    try {
      const [contests] = await pool.query(`
        SELECT * FROM contests 
        WHERE name LIKE ? OR year = ?
        ORDER BY year DESC, name
        LIMIT ?
      `, [`%${searchTerm}%`, isNaN(searchTerm) ? 0 : parseInt(searchTerm), limit]);
      
      return contests;
    } catch (error) {
      console.error('Ошибка при поиске контестов:', error);
      throw error;
    }
  },

  // Получить контесты по году
  getContestsByYear: async (year) => {
    try {
      const [contests] = await pool.query(
        'SELECT * FROM contests WHERE year = ? ORDER BY name',
        [year]
      );
      return contests;
    } catch (error) {
      console.error('Ошибка при получении контестов по году:', error);
      throw error;
    }
  },

  // Получить статистику по контестам
  getContestsStats: async () => {
    try {
      const [stats] = await pool.query(`
        SELECT 
          year,
          COUNT(*) as contest_count,
          COUNT(DISTINCT tc.task_id) as total_tasks
        FROM contests c
        LEFT JOIN task_contests tc ON c.id = tc.contest_id
        GROUP BY year
        ORDER BY year DESC
      `);
      
      return stats;
    } catch (error) {
      console.error('Ошибка при получении статистики контестов:', error);
      throw error;
    }
  }
};

module.exports = contestModel;