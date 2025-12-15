const mysql = require("mysql2");
require('dotenv').config();

const pool = mysql.createPool ({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,           // Максимальное количество соединений
  queueLimit: 0,                 // Без ограничения очереди
  enableKeepAlive: true,         // Поддержание соединения
  keepAliveInitialDelay: 0
});


// // Синхронное подключение к БД
// pool.connect((err, client, release) => {
//   if (err) {
//     console.error('Ошибка подключения к БД:', err.stack);
//   } else {
//     console.log('Успешное подключение к базе данных MySQL');
//     release();
//   }
// });

// Асинхронное подключение к БД
// Преобразуем в промисы для async/await
const promisePool = pool.promise();

// Проверка подключения
(async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Успешное подключение к MySQL!');
    connection.release(); // Возвращаем соединение в пул
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error.message);
  }
})();

module.exports = promisePool;