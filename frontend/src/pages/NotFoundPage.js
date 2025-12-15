// import React from 'react';
// import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// const NotFoundPage = () => {
//   const navigate = useNavigate();
//   const { isAuthenticated } = useAuth();

//   // Случайные забавные сообщения для 404
//   const funnyMessages = [
//     "Ой-ой! Похоже, эта страница ушла на кофе-брейк ☕",
//     "404: Страница не найдена. Возможно, она в отпуске 🏖️",
//     "Упс! Мы искали, но не нашли то, что вы ищете 🔍",
//     "Кажется, вы свернули не туда. Давайте вернемся на правильный путь! 🗺️",
//     "Этой страницы не существует. Или она очень хорошо прячется? 🕵️‍♂️",
//     "404: Страница пропала без вести. Мы уже отправили поисковую команду 🚁"
//   ];

//   // Случайный выбор сообщения
//   const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

//   // Возможные пути для редиректа
//   const suggestedPaths = [
//     { path: '/tasks', label: '🗂️ К списку задач', description: 'Посмотреть все задачи' },
//     { path: '/login', label: '🔐 Вход в систему', description: 'Авторизоваться', show: !isAuthenticated },
//     { path: '/admin', label: '⚙️ Админ-панель', description: 'Управление системой', show: isAuthenticated }
//   ].filter(item => item.show !== false); // Фильтруем по условию show

//   return (
//     <Container className="mt-5">
//       <Row className="justify-content-center">
//         <Col md={8} lg={6}>
//           <Card className="shadow-lg border-0">
//             <Card.Body className="text-center p-5">
//               {/* Анимация или иконка 404 */}
//               <div className="mb-4">
//                 <div style={{
//                   fontSize: '6rem',
//                   fontWeight: 'bold',
//                   color: '#6c757d',
//                   opacity: 0.1,
//                   position: 'relative',
//                   marginBottom: '-2rem'
//                 }}>
//                   404
//                 </div>
//                 <div style={{
//                   fontSize: '5rem',
//                   marginBottom: '1rem'
//                 }}>
//                   🚫
//                 </div>
//               </div>

//               <Card.Title as="h1" className="mb-3">
//                 Страница не найдена
//               </Card.Title>
              
//               <Alert variant="info" className="mb-4">
//                 <Alert.Heading>💡 {randomMessage}</Alert.Heading>
//                 <p className="mb-0">
//                   Возможно, страница была перемещена, удалена или вы ввели неверный URL.
//                 </p>
//               </Alert>

//               <div className="mb-4">
//                 <h5 className="mb-3">🔄 Попробуйте одно из этих действий:</h5>
                
//                 <div className="d-flex flex-column gap-3 mb-4">
//                   {/* Кнопка "Назад" */}
//                   <Button 
//                     variant="outline-secondary" 
//                     onClick={() => navigate(-1)}
//                     className="text-start"
//                   >
//                     <div className="d-flex align-items-center">
//                       <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>↩️</span>
//                       <div>
//                         <div className="fw-bold">Вернуться назад</div>
//                         <small className="text-muted">К предыдущей странице</small>
//                       </div>
//                     </div>
//                   </Button>

//                   {/* Домашняя страница */}
//                   <Button 
//                     as={Link}
//                     to="/"
//                     variant="outline-primary"
//                     className="text-start"
//                   >
//                     <div className="d-flex align-items-center">
//                       <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🏠</span>
//                       <div>
//                         <div className="fw-bold">На главную</div>
//                         <small className="text-muted">Вернуться на домашнюю страницу</small>
//                       </div>
//                     </div>
//                   </Button>

//                   {/* Предложенные пути */}
//                   {suggestedPaths.map((item, index) => (
//                     <Button
//                       key={index}
//                       as={Link}
//                       to={item.path}
//                       variant="outline-success"
//                       className="text-start"
//                     >
//                       <div className="d-flex align-items-center">
//                         <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
//                           {item.label.split(' ')[0]}
//                         </span>
//                         <div>
//                           <div className="fw-bold">{item.label.substring(3)}</div>
//                           <small className="text-muted">{item.description}</small>
//                         </div>
//                       </div>
//                     </Button>
//                   ))}
//                 </div>
//               </div>

//               {/* Дополнительная помощь */}
//               <Card className="bg-light">
//                 <Card.Body>
//                   <h6 className="mb-2">🆘 Нужна помощь?</h6>
//                   <p className="mb-0 small text-muted">
//                     Если вы считаете, что это ошибка, свяжитесь с администратором или проверьте URL адрес.
//                   </p>
//                 </Card.Body>
//               </Card>

//               {/* Отладочная информация (только в development) */}
//               {process.env.NODE_ENV === 'development' && (
//                 <div className="mt-4 p-3 border rounded bg-light">
//                   <h6 className="mb-2">🐛 Отладочная информация:</h6>
//                   <pre className="mb-0 small text-muted">
//                     URL: {window.location.href}<br/>
//                     Path: {window.location.pathname}<br/>
//                     User: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
//                   </pre>
//                 </div>
//               )}

//               {/* Интересные факты (опционально) */}
//               <div className="mt-4">
//                 <small className="text-muted">
//                   💡 Знаете ли вы? Код ошибки 404 был впервые введен в 1990 году в CERN.
//                 </small>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// export default NotFoundPage;

// альтернативный вариант

import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const NotFoundPageSimple = () => {
  const navigate = useNavigate();

  return (
    <Container className="text-center py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          {/* Анимация или SVG */}
          <div className="mb-4">
            <svg 
              width="200" 
              height="200" 
              viewBox="0 0 200 200" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="mb-3"
            >
              <circle cx="100" cy="100" r="95" stroke="#dee2e6" strokeWidth="2" strokeDasharray="5,5"/>
              <circle cx="70" cy="70" r="20" fill="#ff6b6b" opacity="0.7"/>
              <circle cx="130" cy="70" r="20" fill="#4ecdc4" opacity="0.7"/>
              <path d="M70 130C70 100 100 110 130 130" stroke="#ffd166" strokeWidth="8" strokeLinecap="round"/>
              <text x="100" y="180" textAnchor="middle" fill="#6c757d" fontSize="24" fontWeight="bold">404</text>
            </svg>
          </div>

          <h1 className="display-4 fw-bold text-muted mb-3">Oops!</h1>
          <h2 className="h4 text-muted mb-4">Страница не найдена</h2>
          
          <p className="lead mb-4">
            Извините, но страница, которую вы ищете, не существует или была перемещена.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate(-1)}
              className="px-4"
            >
              ← Назад
            </Button>
            
            <Button 
              as={Link}
              to="/"
              variant="success" 
              size="lg"
              className="px-4"
            >
              🏠 На главную
            </Button>
            
            <Button 
              as={Link}
              to="/tasks"
              variant="outline-primary" 
              size="lg"
              className="px-4"
            >
              📋 К задачам
            </Button>
          </div>

          <div className="mt-5 pt-4 border-top">
            <p className="text-muted small mb-2">
              Если проблема повторяется, свяжитесь с поддержкой
            </p>
            <Button 
              variant="link" 
              size="sm"
              className="text-decoration-none"
              onClick={() => window.location.reload()}
            >
              ↻ Обновить страницу
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPageSimple;