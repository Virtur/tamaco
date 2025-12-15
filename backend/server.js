const express = require("express"); // для создания сервера
const cors = require('cors'); // для разрешения междоменных запросов (от фронта к бэку)
require('dotenv').config(); // для подключения .env где хранятся пароли к бд, чтобы не хранить прямо в коде
const fs = require('fs'); // для работы с файлами
const initDatabase = require('./models/initDatabase'); // для создания бд
const pool = require('./config/db'); // подключение к бд


// Пути
const authRoutes = require('./routes/authRoutes');
const { authenticateToken, logRequest } = require('./middleware/auth'); // логирование запросов
//const { router: authRoutes, authenticateToken } = require('./routes/authRoutes'); // альтернативный путь для тестирования аутентификации
const tagRoutes = require('./routes/tagRoutes');
const contestRoutes = require('./routes/contestRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Создаем объект приложения
const app = express();
const PORT = process.env.PORT || 3001;

// Логирование всех запросов в консоль для тестирование
app.use(logRequest);

// Middleware
// app.use(cors()); // разрешаем все CORS запросы (запросы между разными доменами (серверами))
app.use(cors({
  origin: 'http://localhost:3000', // Разрешаем запросы с фронтенда
  credentials: true
}));
app.use(express.json()); //разрешаем только получение json файлов с сервера
app.use(express.urlencoded({ extended: true })); // Для данных формы

// Инициализация БД при запуске
initDatabase().then(() => {
  console.log('✅ База данных инициализирована');
}).catch(err => {
  console.error('❌ Ошибка инициализации БД:', err);
});

// Логируем все запросы перед получением ответа от сервера в файл server.log
app.use(function(request, response, next){
     
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const data = `${hour}:${minutes}:${seconds} ${request.method} ${request.url} ${request.get("user-agent")}`;
    console.log(data);
    fs.appendFile("server.log", data + "\n", function(error){
        if(error) return console.log(error); // если возникла ошибка    
        console.log("Запись файла завершена");
    });
    next();
});

// Маршруты
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/contests', contestRoutes);

// Защищенный маршрут для теста
app.get('/api/admin/test', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  res.json({ 
    success: true,
    message: 'Добро пожаловать, администратор!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Тестовый маршрут для проверки ролей
app.get('/api/test/role/:role', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: `Доступ разрешен для роли: ${req.user.role}`,
    user: req.user,
    requiredRole: req.params.role,
    hasAccess: req.user.role === req.params.role
  });
});

// обработчик для запроса по адресу "/api"
app.get("/api", function(req, res){

    // отправляем ответ
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Tamaco API',
      database: 'MySQL'
    });
    // res.send("<h2>Backend работает стабильно</h2>"); // альтернативный ответ для проверки работы бэка
    //res.sendFile(__dirname + "/server.log"); // альтернативный ответ для логов
});

// Базовый route для тестирования БД
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() as `current_time`, VERSION() as version');
    res.json({ 
      success: true,
      message: 'База данных MySQL подключена успешно!',
      database: {
        currentTime: rows[0].current_time,
        version: rows[0].version,
        name: process.env.DB_NAME
      }
    });
  } catch (error) {
    console.error('Ошибка тестирования БД:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка подключения к базе данных',
      details: error.message 
    });
  }
});

// Простой route для задач (для теста)
app.get('/api/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения задач:', error);
    res.status(500).json({ error: error.message });
  }
});


// Простой route для тегов (для теста)
app.get('/api/tag', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM tags
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения задач:', error);
    res.status(500).json({ error: error.message });
  }
});


// Проверка работоспособности
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Tamaco API',
    database: 'MySQL'
  });
});

// Обработка 404
app.use('/', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.originalUrl,
    availableRoutes: ['/api/tasks', '/api/auth', '/api/tags', '/api/contests']
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('🔥 Необработанная ошибка:', err);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: err.message
  });
});

// начинаем прослушивать подключения на 3000 порту
app.listen(PORT, ()=>{
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 API доступно по адресу: http://localhost:${PORT}/api`);
  console.log(`🛠  Тест БД: http://localhost:${PORT}/api/test-db`);
});