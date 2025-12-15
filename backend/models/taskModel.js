const pool = require('../config/db'); // подключаемся к пулу БД

const taskModel = {
  // Получить все задачи с пагинацией
  getAllTasks: async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    
    // Получаем задачи
    const [tasks] = await pool.query(`
      SELECT t.*, 
             GROUP_CONCAT(DISTINCT tag.name) as tags,
             GROUP_CONCAT(DISTINCT c.name) as contests
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      LEFT JOIN tags tag ON tt.tag_id = tag.id
      LEFT JOIN task_contests tc ON t.id = tc.task_id
      LEFT JOIN contests c ON tc.contest_id = c.id
      GROUP BY t.id
      ORDER BY t.id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]); // показываем установленный лимит и смещаем на этот лимит постранично
    
    // Получаем общее количество
    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) as total FROM tasks
    `);
    
    return {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit) //считаем количество страниц (округляя в больщую сторону)
      }
    };
  },

  // Получить задачу по ID
  getTaskById: async (id) => {
    const [rows] = await pool.query(`
      SELECT t.*, 
             GROUP_CONCAT(DISTINCT tag.name) as tags,
             GROUP_CONCAT(DISTINCT c.name) as contests
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      LEFT JOIN tags tag ON tt.tag_id = tag.id
      LEFT JOIN task_contests tc ON t.id = tc.task_id
      LEFT JOIN contests c ON tc.contest_id = c.id
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);
    
    return rows[0] || null;
  },

  // Создать задачу
  createTask: async (taskData) => {
    const {
      title_ru,
      description = '',
      solution_idea = '',
      polygon_url = '',
      difficulty = 5,
      note = '',
      tags = [],
      contests = []
    } = taskData;

    // Начинаем транзакцию (важно для целостности данных, если не будет выполнено одно из действий трансакция откатится на состояние до начала трансакции)
    const connection = await pool.getConnection(); // для этого создается отдельное подключение к БД
    await connection.beginTransaction(); // начинаем трансакцию

    try {
      // Вставляем задачу
      const [result] = await connection.query(`
        INSERT INTO tasks (title_ru, description, solution_idea, polygon_url, difficulty, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [title_ru, description, solution_idea, polygon_url, difficulty, note]);

      const taskId = result.insertId;

      // Добавляем теги
      if (tags.length > 0) {
        const tagValues = tags.map(tagId => [taskId, tagId]);
        await connection.query(`
          INSERT INTO task_tags (task_id, tag_id) VALUES ?
        `, [tagValues]);
      }

      // Добавляем контесты
      if (contests.length > 0) {
        const contestValues = contests.map(contestId => [taskId, contestId]);
        await connection.query(`
          INSERT INTO task_contests (task_id, contest_id) VALUES ?
        `, [contestValues]);
      }

      // Коммитим транзакцию (закрываем трансакцию)
      await connection.commit();
      connection.release(); // возвращаем соединение в пул

      // Возвращаем созданную задачу
      return await taskModel.getTaskById(taskId);
      
    } catch (error) {
      // Откатываем транзакцию при ошибке
      await connection.rollback();
      connection.release(); // возвращаем соединение в пул
      throw error;
    }
  },

  // Фильтрация задач по сложности и тегам
  filterTasks: async (minDifficulty, maxDifficulty, tagIds = []) => {
    let query = `
      SELECT DISTINCT t.*,
             GROUP_CONCAT(DISTINCT tag.name) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      LEFT JOIN tags tag ON tt.tag_id = tag.id
      WHERE t.difficulty BETWEEN ? AND ?
    `;
    
    const params = [minDifficulty, maxDifficulty];
    
    // Добавляем фильтр по тегам если нужно
    if (tagIds.length > 0) {
      query += `
        AND t.id IN (
          SELECT task_id 
          FROM task_tags 
          WHERE tag_id IN (?) 
          GROUP BY task_id 
          HAVING COUNT(DISTINCT tag_id) = ?
        )
      `;
      params.push(tagIds, tagIds.length);
    }
    
    query += ` GROUP BY t.id ORDER BY t.difficulty`;
    
    const [tasks] = await pool.query(query, params);
    return tasks;
  },
  
  // Получить задачи по тегу
  getTasksByTag: async (tagId, page = 1, limit = 20) => {
    try {
      const offset = (page - 1) * limit;
      
      const [tasks] = await pool.query(`
        SELECT t.* 
        FROM tasks t
        JOIN task_tags tt ON t.id = tt.task_id
        WHERE tt.tag_id = ?
        ORDER BY t.difficulty, t.title_ru
        LIMIT ? OFFSET ?
      `, [tagId, limit, offset]);
      
      
      // Общее количество задач с этим тегом
      const [[{ total }]] = await pool.query(
        'SELECT COUNT(*) as total FROM task_tags WHERE tag_id = ?',
        [tagId]
      );
      
      return {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Ошибка при получении задач по тегу:', error);
      throw error;
    }
  },

  // Получить задачи по контесту
  getTasksByContest: async (contestId, page = 1, limit = 20) => {
    try {
      const offset = (page - 1) * limit;
      
      const [tasks] = await pool.query(`
        SELECT t.* 
        FROM tasks t
        JOIN task_contests tc ON t.id = tc.task_id
        WHERE tc.contest_id = ?
        ORDER BY t.difficulty, t.title_ru
        LIMIT ? OFFSET ?
      `, [contestId, limit, offset]);
      
      // Общее количество задач в контесте
      const [[{ total }]] = await pool.query(
        'SELECT COUNT(*) as total FROM task_contests WHERE contest_id = ?',
        [contestId]
      );
      
      return {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Ошибка при получении задач по контесту:', error);
      throw error;
    }
  },

  // Поиск задач по названию
  searchTasks: async (searchTerm, page = 1, limit = 20) => {
    try {
      const offset = (page - 1) * limit;
      
      const [tasks] = await pool.query(`
        SELECT t.*,
               GROUP_CONCAT(DISTINCT tag.name) as tags
        FROM tasks t
        LEFT JOIN task_tags tt ON t.id = tt.task_id
        LEFT JOIN tags tag ON tt.tag_id = tag.id
        WHERE t.title_ru LIKE ? OR t.description LIKE ?
        GROUP BY t.id
        ORDER BY t.id DESC
        LIMIT ? OFFSET ?
      `, [`%${searchTerm}%`, `%${searchTerm}%`, limit, offset]);
      
      // Общее количество
      const [[{ total }]] = await pool.query(`
        SELECT COUNT(DISTINCT t.id) as total
        FROM tasks t
        LEFT JOIN task_tags tt ON t.id = tt.task_id
        WHERE t.title_ru LIKE ? OR t.description LIKE ?
      `, [`%${searchTerm}%`, `%${searchTerm}%`]);
      
      return {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Ошибка при поиске задач:', error);
      throw error;
    }
  },

  // Получить статистику по задачам
  getTasksStats: async () => {
    try {
      const [stats] = await pool.query(`
        SELECT 
          difficulty,
          COUNT(*) as count,
          AVG(difficulty) as avg_difficulty,
          SUM(CASE WHEN is_codeforces_ready = TRUE THEN 1 ELSE 0 END) as codeforces_ready,
          SUM(CASE WHEN is_yandex_ready = TRUE THEN 1 ELSE 0 END) as yandex_ready
        FROM tasks
        GROUP BY difficulty
        ORDER BY difficulty
      `);
      
      // Общая статистика
      const [[overall]] = await pool.query(`
        SELECT 
          COUNT(*) as total_tasks,
          AVG(difficulty) as overall_avg_difficulty,
          MIN(difficulty) as min_difficulty,
          MAX(difficulty) as max_difficulty,
          COUNT(DISTINCT id) as unique_tasks
        FROM tasks
      `);
      
      return {
        byDifficulty: stats,
        overall
      };
    } catch (error) {
      console.error('Ошибка при получении статистики задач:', error);
      throw error;
    }
  },

  // Обновить задачу
  updateTask: async (taskId, updates) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      console.log(`🔄 Начинаем транзакцию для обновления задачи ${taskId}`);

      // 1. Проверяем существование задачи
      const [[existingTask]] = await connection.query(
        'SELECT id FROM tasks WHERE id = ?',
        [taskId]
      );

      if (!existingTask) {
        throw new Error('Задача не найдена');
      }

      // 2. Подготавливаем данные для обновления
      const {
        title_ru,
        description,
        solution_idea,
        polygon_url,
        difficulty,
        note,
        tags = null,        // null означает "не обновлять"
        contests = null     // null означает "не обновлять"
      } = updates;

      // 3. Собираем поля для обновления
      const updateFields = [];
      const updateValues = [];
      
      if (title_ru !== undefined) {
        updateFields.push('title_ru = ?');
        updateValues.push(title_ru.trim());
      }
      
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      
      if (solution_idea !== undefined) {
        updateFields.push('solution_idea = ?');
        updateValues.push(solution_idea);
      }
      
      if (polygon_url !== undefined) {
        updateFields.push('polygon_url = ?');
        updateValues.push(polygon_url);
        
        // Автоматически обновляем флаги платформ (для тестирования)
        // if (polygon_url.includes('polygon.codeforces.com')) {
        //   updateFields.push('is_codeforces_ready = TRUE');
        // } else {
        //   updateFields.push('is_codeforces_ready = FALSE');
        // }
        
        // if (polygon_url.includes('contest.yandex')) {
        //   updateFields.push('is_yandex_ready = TRUE');
        // } else {
        //   updateFields.push('is_yandex_ready = FALSE');
        // }
      }
      
      if (difficulty !== undefined) {
        if (difficulty < 1 || difficulty > 10) {
          throw new Error('Сложность должна быть от 1 до 10');
        }
        updateFields.push('difficulty = ?');
        updateValues.push(difficulty);
      }
      
      if (note !== undefined) {
        updateFields.push('note = ?');
        updateValues.push(note);
      }
      
      // Добавляем updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      // 4. Выполняем обновление если есть поля для обновления
      if (updateFields.length > 0) {
        updateValues.push(taskId);
        
        const updateQuery = `
          UPDATE tasks 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;
        
        await connection.query(updateQuery, updateValues);
        console.log(`✅ Основные поля задачи ${taskId} обновлены`);
      }

      // 5. Обновляем теги (если переданы)
      
      if (tags !== null) {
      console.log('🏷️ Обработка тегов:', { tags, type: typeof tags });
      
      // Преобразуем tags в массив
      let tagsArray = [];
      
      if (Array.isArray(tags)) {
        tagsArray = tags;
      } else if (typeof tags === 'string') {
        // Удаляем скобки если есть [1,2,3]
        const cleaned = tags.replace(/[\[\]\s]/g, '');
        if (cleaned) {
          tagsArray = cleaned.split(',')
            .map(item => parseInt(item.trim()))
            .filter(item => !isNaN(item) && item > 0);
        }
      } else if (typeof tags === 'number') {
        tagsArray = [tags];
      }
      
      console.log(`✅ Преобразованные теги (${tagsArray.length}):`, tagsArray);
      
      // Удаляем старые теги
      await connection.query(
        'DELETE FROM task_tags WHERE task_id = ?',
        [taskId]
      );
      console.log(`🗑️ Удалены старые теги для задачи ${taskId}`);
      
      // Добавляем новые теги (если есть)
      if (tagsArray.length > 0) {
        // Используем более безопасный способ с подготовкой statement
        const tagValues = tagsArray.map(tagId => [taskId, tagId]);
        const insertQuery = `
          INSERT INTO task_tags (task_id, tag_id) 
          VALUES ?
        `;
        
        await connection.query(insertQuery, [tagValues]);
        console.log(`✅ Добавлено ${tagsArray.length} новых тегов`);
      } else {
        console.log('ℹ️ Нет тегов для добавления');
      }
    } else {
      console.log('ℹ️ Теги не переданы, пропускаем обновление тегов');
    }

      // 6. Обновляем контесты (если переданы)

      if (contests !== null) {
      console.log('🏆 Обработка контестов:', { contests, type: typeof contests });
      
      // Аналогично преобразуем contests в массив
      let contestsArray = [];
      
      if (Array.isArray(contests)) {
        contestsArray = contests;
      } else if (typeof contests === 'string') {
        const cleaned = contests.replace(/[\[\]\s]/g, '');
        if (cleaned) {
          contestsArray = cleaned.split(',')
            .map(item => parseInt(item.trim()))
            .filter(item => !isNaN(item) && item > 0);
        }
      }
      
      console.log(`✅ Преобразованные контесты (${contestsArray.length}):`, contestsArray);
      
      // Удаляем старые контесты
      await connection.query(
        'DELETE FROM task_contests WHERE task_id = ?',
        [taskId]
      );
      
      // Добавляем новые контесты (если есть)
      if (contestsArray.length > 0) {
        const contestValues = contestsArray.map(contestId => [taskId, contestId]);
        const insertQuery = `
          INSERT INTO task_contests (task_id, contest_id) 
          VALUES ?
        `;
        
        await connection.query(insertQuery, [contestValues]);
        console.log(`✅ Добавлено ${contestsArray.length} контестов`);
      }
    }

      // if (contests !== null) {
      //   // Удаляем старые контесты
      //   await connection.query(
      //     'DELETE FROM task_contests WHERE task_id = ?',
      //     [taskId]
      //   );
      //   console.log(`🗑️ Удалены старые контесты для задачи ${taskId}`);
        
      //   // Добавляем новые контесты (если есть)
      //   if (contests.length > 0) {
      //     const contestValues = contests.map(contestId => [taskId, contestId]);
      //     const placeholders = contestValues.map(() => '(?, ?)').join(', ');
      //     const flatValues = contestValues.flat();
          
      //     await connection.query(
      //       `INSERT INTO task_contests (task_id, contest_id) VALUES ${placeholders}`,
      //       flatValues
      //     );
      //     console.log(`🏆 Добавлено ${contests.length} новых контестов`);
      //   }
      // }

      // 7. Коммитим транзакцию
      await connection.commit();
      console.log(`🎉 Транзакция для задачи ${taskId} успешно завершена`);

      // 8. Возвращаем обновленную задачу
      const updatedTask = await taskModel.getTaskById(taskId);
      
      return updatedTask;
      
    } catch (error) {
      // 9. Откатываем в случае ошибки
      console.error(`❌ Ошибка обновления задачи ${taskId}:`, error.message);
      
      if (connection) {
        await connection.rollback();
        console.log(`↩️ Транзакция откатана для задачи ${taskId}`);
      }
      
      throw error;
    } finally {
      // 10. Всегда возвращаем соединение
      if (connection) {
        connection.release();
      }
    }
  },

  // Частичное обновление задачи (только указанные поля)
  patchTask: async (taskId, updates) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Проверяем существование задачи
      const [[existingTask]] = await connection.query(
        'SELECT id FROM tasks WHERE id = ?',
        [taskId]
      );

      if (!existingTask) {
        throw new Error('Задача не найдена');
      }

      // Собираем только переданные поля
      const allowedFields = [
        'title_ru', 'description', 'solution_idea', 
        'polygon_url', 'difficulty', 'note'
      ];
      
      const updateFields = [];
      const updateValues = [];
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          
          if (field === 'title_ru') {
            updateValues.push(updates[field].trim());
          } else if (field === 'difficulty') {
            if (updates[field] < 1 || updates[field] > 10) {
              throw new Error('Сложность должна быть от 1 до 10');
            }
            updateValues.push(updates[field]);
          } else {
            updateValues.push(updates[field]);
          }
        }
      }
      
      // Обновляем флаги платформ если меняется URL
      if (updates.polygon_url !== undefined) {
        if (updates.polygon_url.includes('polygon.codeforces.com')) {
          updateFields.push('is_codeforces_ready = TRUE');
        } else {
          updateFields.push('is_codeforces_ready = FALSE');
        }
        
        if (updates.polygon_url.includes('contest.yandex')) {
          updateFields.push('is_yandex_ready = TRUE');
        } else {
          updateFields.push('is_yandex_ready = FALSE');
        }
      }
      
      // Добавляем updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      // Выполняем обновление если есть поля
      if (updateFields.length > 0) {
        updateValues.push(taskId);
        
        const updateQuery = `
          UPDATE tasks 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;
        
        await connection.query(updateQuery, updateValues);
      }
      
      // Для tags и contests используем полное обновление через updateTask
      if (updates.tags !== undefined || updates.contests !== undefined) {
        const tagContestUpdates = {};
        if (updates.tags !== undefined) tagContestUpdates.tags = updates.tags;
        if (updates.contests !== undefined) tagContestUpdates.contests = updates.contests;
        
        // Вызываем updateTask для обновления связей
        await taskModel.updateTask(taskId, tagContestUpdates);
      }

      await connection.commit();
      
      // Возвращаем обновленную задачу
      return await taskModel.getTaskById(taskId);
      
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  // Обновить только сложность задачи (!Не используем в проекте)
  updateTaskDifficulty: async (taskId, newDifficulty) => {
    if (newDifficulty < 1 || newDifficulty > 10) {
      throw new Error('Сложность должна быть от 1 до 10');
    }
    
    const [result] = await pool.query(
      'UPDATE tasks SET difficulty = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newDifficulty, taskId]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Задача не найдена');
    }
    
    return await taskModel.getTaskById(taskId);
  },

  // Обновить только теги задачи (!Не используем в проекте)
  updateTaskTags: async (taskId, tagIds) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Удаляем старые теги
      await connection.query(
        'DELETE FROM task_tags WHERE task_id = ?',
        [taskId]
      );
      
      // Добавляем новые теги если есть
      if (tagIds && tagIds.length > 0) {
        const tagValues = tagIds.map(tagId => [taskId, tagId]);
        const placeholders = tagValues.map(() => '(?, ?)').join(', ');
        const flatValues = tagValues.flat();
        
        await connection.query(
          `INSERT INTO task_tags (task_id, tag_id) VALUES ${placeholders}`,
          flatValues
        );
      }
      
      // Обновляем время изменения
      await connection.query(
        'UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [taskId]
      );
      
      await connection.commit();
      
      return await taskModel.getTaskById(taskId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Удалить задачу
  deleteTask: async (taskId) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      console.log(`🔄 Начинаем транзакцию для удаления задачи ${taskId}`);

      // 1. Проверяем существование задачи
      const [[task]] = await connection.query(
        'SELECT title_ru FROM tasks WHERE id = ?',
        [taskId]
      );

      if (!task) {
        throw new Error('Задача не найдена');
      }

      const taskTitle = task.title_ru;
      console.log(`🗑️ Удаляем задачу: "${taskTitle}" (ID: ${taskId})`);

      // 2. Удаляем связи из промежуточных таблиц
      // (CASCADE в БД сделает это автоматически, но лучше явно для логирования)
      console.log(`   Удаляем связи задачи ${taskId} с тегами...`);
      const [tagsDeleted] = await connection.query(
        'DELETE FROM task_tags WHERE task_id = ?',
        [taskId]
      );
      console.log(`   Удалено связей с тегами: ${tagsDeleted.affectedRows}`);

      console.log(`   Удаляем связи задачи ${taskId} с контестами...`);
      const [contestsDeleted] = await connection.query(
        'DELETE FROM task_contests WHERE task_id = ?',
        [taskId]
      );
      console.log(`   Удалено связей с контестами: ${contestsDeleted.affectedRows}`);

      // 3. Удаляем саму задачу
      console.log(`   Удаляем задачу ${taskId} из таблицы tasks...`);
      const [result] = await connection.query(
        'DELETE FROM tasks WHERE id = ?',
        [taskId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Не удалось удалить задачу');
      }

      // 4. Коммитим транзакцию
      await connection.commit();
      console.log(`✅ Задача "${taskTitle}" успешно удалена`);

      return {
        success: true,
        message: `Задача "${taskTitle}" успешно удалена`,
        deletedId: taskId,
        stats: {
          tagsDeleted: tagsDeleted.affectedRows,
          contestsDeleted: contestsDeleted.affectedRows
        }
      };
      
    } catch (error) {
      // 5. Откатываем в случае ошибки
      console.error(`❌ Ошибка удаления задачи ${taskId}:`, error.message);
      
      if (connection) {
        await connection.rollback();
        console.log(`↩️ Транзакция откатана для задачи ${taskId}`);
      }
      
      throw error;
    } finally {
      // 6. Всегда возвращаем соединение
      if (connection) {
        connection.release();
      }
    }
  },

  // Удалить несколько задач
  deleteMultipleTasks: async (taskIds) => {
    const connection = await pool.getConnection();
    
    try {
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw new Error('Некорректный список ID задач');
      }

      // Валидация ID
      const validTaskIds = taskIds.filter(id => 
        Number.isInteger(id) && id > 0
      );

      if (validTaskIds.length === 0) {
        throw new Error('Нет валидных ID задач для удаления');
      }

      await connection.beginTransaction();
      console.log(`🔄 Начинаем транзакцию для удаления ${validTaskIds.length} задач`);

      // 1. Получаем информацию о задачах для логирования
      const placeholders = validTaskIds.map(() => '?').join(',');
      const [tasks] = await connection.query(
        `SELECT id, title_ru FROM tasks WHERE id IN (${placeholders})`,
        validTaskIds
      );

      if (tasks.length === 0) {
        throw new Error('Задачи не найдены');
      }

      const deletedTaskIds = tasks.map(task => task.id);
      const deletedTaskTitles = tasks.map(task => task.title_ru);

      console.log(`🗑️ Удаляем задачи: ${deletedTaskTitles.join(', ')}`);

      // 2. Удаляем связи из промежуточных таблиц
      console.log('   Удаляем связи с тегами...');
      const [tagsDeleted] = await connection.query(
        `DELETE FROM task_tags WHERE task_id IN (${placeholders})`,
        validTaskIds
      );

      console.log('   Удаляем связи с контестами...');
      const [contestsDeleted] = await connection.query(
        `DELETE FROM task_contests WHERE task_id IN (${placeholders})`,
        validTaskIds
      );

      // 3. Удаляем задачи
      console.log('   Удаляем задачи из таблицы tasks...');
      const [result] = await connection.query(
        `DELETE FROM tasks WHERE id IN (${placeholders})`,
        validTaskIds
      );

      // 4. Коммитим транзакцию
      await connection.commit();
      console.log(`✅ Успешно удалено ${result.affectedRows} задач`);

      return {
        success: true,
        message: `Успешно удалено ${result.affectedRows} задач`,
        deletedCount: result.affectedRows,
        deletedIds: deletedTaskIds,
        deletedTitles: deletedTaskTitles,
        stats: {
          tagsDeleted: tagsDeleted.affectedRows,
          contestsDeleted: contestsDeleted.affectedRows
        }
      };
      
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  // Удалить все задачи (ОПАСНО! Только для админа/тестов)
  deleteAllTasks: async () => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      console.log('🚨 НАЧАЛО УДАЛЕНИЯ ВСЕХ ЗАДАЧ');

      // 1. Получаем количество задач для логирования
      const [[{ total }]] = await connection.query(
        'SELECT COUNT(*) as total FROM tasks'
      );

      if (total === 0) {
        console.log('ℹ️ Нет задач для удаления');
        return {
          success: true,
          message: 'Нет задач для удаления',
          deletedCount: 0
        };
      }

      console.log(`🗑️ Найдено задач для удаления: ${total}`);

      // 2. Удаляем связи
      console.log('   Очищаем таблицу task_tags...');
      await connection.query('DELETE FROM task_tags');
      
      console.log('   Очищаем таблицу task_contests...');
      await connection.query('DELETE FROM task_contests');

      // 3. Удаляем все задачи
      console.log('   Очищаем таблицу tasks...');
      const [result] = await connection.query('DELETE FROM tasks');

      // 4. Сбрасываем автоинкремент (опционально)
      await connection.query('ALTER TABLE tasks AUTO_INCREMENT = 1');

      // 5. Коммитим транзакцию
      await connection.commit();
      console.log(`✅ УДАЛЕНО ВСЕГО: ${result.affectedRows} задач`);

      return {
        success: true,
        message: `Удалено всех задач: ${result.affectedRows}`,
        deletedCount: result.affectedRows,
        warning: 'ВСЕ ЗАДАЧИ БЫЛИ УДАЛЕНЫ!'
      };
      
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  // Удалить задачи по фильтру
  deleteTasksByFilter: async (filter) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Строим WHERE условие
      const conditions = [];
      const params = [];

      if (filter.minDifficulty !== undefined) {
        conditions.push('difficulty >= ?');
        params.push(filter.minDifficulty);
      }

      if (filter.maxDifficulty !== undefined) {
        conditions.push('difficulty <= ?');
        params.push(filter.maxDifficulty);
      }

      if (filter.tagId !== undefined) {
        conditions.push(`
          id IN (
            SELECT task_id 
            FROM task_tags 
            WHERE tag_id = ?
          )
        `);
        params.push(filter.tagId);
      }

      if (filter.contestId !== undefined) {
        conditions.push(`
          id IN (
            SELECT task_id 
            FROM task_contests 
            WHERE contest_id = ?
          )
        `);
        params.push(filter.contestId);
      }

      if (filter.isCodeforcesReady !== undefined) {
        conditions.push('is_codeforces_ready = ?');
        params.push(filter.isCodeforcesReady);
      }

      if (filter.isYandexReady !== undefined) {
        conditions.push('is_yandex_ready = ?');
        params.push(filter.isYandexReady);
      }

      if (conditions.length === 0) {
        throw new Error('Не указаны условия фильтрации');
      }

      const whereClause = conditions.join(' AND ');

      // 1. Получаем задачи для удаления (для логирования)
      const [tasksToDelete] = await connection.query(
        `SELECT id, title_ru FROM tasks WHERE ${whereClause}`,
        params
      );

      if (tasksToDelete.length === 0) {
        return {
          success: true,
          message: 'Нет задач, соответствующих фильтру',
          deletedCount: 0
        };
      }

      const taskIds = tasksToDelete.map(task => task.id);

      // 2. Удаляем связи
      const placeholders = taskIds.map(() => '?').join(',');
      
      await connection.query(
        `DELETE FROM task_tags WHERE task_id IN (${placeholders})`,
        taskIds
      );

      await connection.query(
        `DELETE FROM task_contests WHERE task_id IN (${placeholders})`,
        taskIds
      );

      // 3. Удаляем задачи
      const [result] = await connection.query(
        `DELETE FROM tasks WHERE id IN (${placeholders})`,
        taskIds
      );

      await connection.commit();

      return {
        success: true,
        message: `Удалено задач по фильтру: ${result.affectedRows}`,
        deletedCount: result.affectedRows,
        deletedIds: taskIds,
        filter: filter
      };
      
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
};

module.exports = taskModel;