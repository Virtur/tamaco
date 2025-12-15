const pool = require('../config/db');

const initDatabase = async () => {
  try {
    console.log('🔄 Создание таблиц в MySQL...');

    // Таблица пользователей
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_login (login)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Таблица тегов
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Таблица контестов
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        year INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_year (year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Таблица задач
    await pool.query(
     `
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title_ru VARCHAR(500) NOT NULL,
        description TEXT,
        solution_idea TEXT,
        polygon_url VARCHAR(500),
        is_codeforces_ready BOOLEAN GENERATED ALWAYS AS (polygon_url IS NOT NULL AND polygon_url != '') STORED,
        is_yandex_ready BOOLEAN GENERATED ALWAYS AS (polygon_url IS NOT NULL AND polygon_url != '') STORED,
        difficulty INT CHECK (difficulty >= 1 AND difficulty <= 10),
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_difficulty (difficulty),
        INDEX idx_created_at (created_at),
        INDEX idx_codeforces_ready (is_codeforces_ready),
        INDEX idx_yandex_ready (is_yandex_ready)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Промежуточная таблица для связи задач и тегов (многие-к-многим)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_tags (
        task_id INT,
        tag_id INT,
        PRIMARY KEY (task_id, tag_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        INDEX idx_tag_id (tag_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Промежуточная таблица для связи задач и контестов (многие-к-многим)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_contests (
        task_id INT,
        contest_id INT,
        PRIMARY KEY (task_id, contest_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
        INDEX idx_contest_id (contest_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Все таблицы успешно созданы!');

    // Добавляем тестовые данные
    await addTestData();
    
  } catch (error) {
    console.error('❌ Ошибка при создании таблиц:', error);
    throw error; // Пробрасываем ошибку дальше
  }
};

const addTestData = async () => {
  try {
    console.log('🔄 Добавление тестовых данных...');

    // Хеш для пароля 'admin123' (bcrypt)
    const adminPasswordHash = '$2a$12$VBco/C2dmkHn7ANro0icfuvYWg2QUD/YkJQCDKJpLh4B4n/WGcE8i';
    
    // Альтернативное решение: создаем свой Хэш
    // const bcrypt = require('bcryptjs');
    // const adminPassword = '12345'; // вписать свой пароль
    // const salt = await bcrypt.genSalt(10);
    // const passwordHash = await bcrypt.hash(adminPassword, salt);
  

    // Добавляем администратора (игнорируем если уже есть)
    await pool.query(`
      INSERT IGNORE INTO users (login, password_hash, role) 
      VALUES (?, ?, ?)
    `, ['admin', adminPasswordHash, 'admin']);
    
    console.log('✅ Администратор создан:');
    console.log('   Логин: admin');
    console.log('   Пароль: admin123'); // вписать свой пароль, если меняли
    console.log('   Роль: admin');

    // Добавляем тестовые теги
    const defaultTags = [
      'mod',
      'ascii-art', 
      'formula',
      'c++',
      'math',
      'algorithms',
      'data'
    ];

    for (const tagName of defaultTags) {
      await pool.query(`
        INSERT IGNORE INTO tags (name) VALUES (?)
      `, [tagName]);
    }

    // Добавляем тестовый контест
    const defaultContests = [
      ['Python 5-7 Start', 2025],
      ['10 TX Операции с числами', 2025], 
      ['Python 5-7 Самостоятельная работа', 2024]
    ];

    for (const contest of defaultContests) {
      await pool.query(`
        INSERT IGNORE INTO contests (name, year) VALUES (?, ?)
      `, contest);
    }

    // Контест для тестирования
    // await pool.query(`
    //   INSERT IGNORE INTO contests (name, year) VALUES (?, ?)
    // `, ['Стартовый контест', 2025]);

    console.log('✅ Тестовые данные добавлены!');
  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых данных:', error);
  }
};

module.exports = initDatabase;