// import React, { useState, useEffect, useContext } from 'react';
// import { 
//   Card, Row, Col, Button, Spinner, Alert, 
//   Badge, Container, Tab, Nav, Table
// } from 'react-bootstrap';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import { FaArrowLeft, FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
// import TaskContext from '../context/TaskContext';
// import { useAuth } from '../context/AuthContext';


// const TaskDetailPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { 
//     selectedTask, 
//     loading, 
//     error, 
//     fetchTaskById, 
//     deleteTask 
//   } = useContext(TaskContext);
  
//   const { isAdmin } = useAuth();
//   const [activeTab, setActiveTab] = useState('description');
//   const [isDeleting, setIsDeleting] = useState(false);

//   useEffect(() => {
//     if (id) {
//       fetchTaskById(id);
//     }
//   }, [id]);

//   const handleDelete = async () => {
//     if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
//       setIsDeleting(true);
//       try {
//         await deleteTask(id);
//         navigate('/tasks');
//       } catch (error) {
//         console.error('Ошибка при удалении:', error);
//       } finally {
//         setIsDeleting(false);
//       }
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('ru-RU', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const DifficultyIndicator = ({ difficulty }) => {
//     let variant = 'secondary';
//     let text = 'Средняя';
    
//     if (difficulty <= 3) {
//       variant = 'success';
//       text = 'Легкая';
//     } else if (difficulty <= 6) {
//       variant = 'warning';
//       text = 'Средняя';
//     } else {
//       variant = 'danger';
//       text = 'Сложная';
//     }
    
//     return (
//       <div className="d-flex align-items-center gap-2">
//         <Badge bg={variant} className="fs-6 px-3 py-2">
//           {difficulty}/10
//         </Badge>
//         <span className="text-muted">{text}</span>
//       </div>
//     );
//   };

//   const PlatformStatus = () => (
//     <div className="d-flex gap-3 mb-4">
//       <div className="d-flex align-items-center gap-2">
//         <div className={`platform-indicator ${selectedTask.is_codeforces_ready ? 'active' : ''}`}>
//           <span className="platform-icon">CF</span>
//         </div>
//         <div>
//           <div className="fw-bold">Codeforces</div>
//           <div className="text-muted small">
//             {selectedTask.is_codeforces_ready 
//               ? 'Готова для заливки' 
//               : 'Не готова'}
//           </div>
//         </div>
//       </div>
      
//       <div className="d-flex align-items-center gap-2">
//         <div className={`platform-indicator ${selectedTask.is_yandex_ready ? 'active' : ''}`}>
//           <span className="platform-icon">Y</span>
//         </div>
//         <div>
//           <div className="fw-bold">Yandex Contest</div>
//           <div className="text-muted small">
//             {selectedTask.is_yandex_ready 
//               ? 'Готова для заливки' 
//               : 'Не готова'}
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   if (loading && !selectedTask) {
//     return (
//       <Container className="py-5 text-center">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-3">Загрузка задачи...</p>
//       </Container>
//     );
//   }

//   if (error && !selectedTask) {
//     return (
//       <Container className="py-5">
//         <Alert variant="danger">
//           <Alert.Heading>Ошибка загрузки задачи</Alert.Heading>
//           <p>{error}</p>
//           <hr />
//           <div className="d-flex justify-content-end">
//             <Button variant="outline-primary" as={Link} to="/tasks">
//               <FaArrowLeft className="me-2" />
//               Вернуться к списку
//             </Button>
//           </div>
//         </Alert>
//       </Container>
//     );
//   }

//   if (!selectedTask) {
//     return (
//       <Container className="py-5 text-center">
//         <Alert variant="warning">
//           <Alert.Heading>Задача не найдена</Alert.Heading>
//           <p>Задача с ID {id} не существует или была удалена.</p>
//           <hr />
//           <Button variant="primary" as={Link} to="/tasks">
//             <FaArrowLeft className="me-2" />
//             Вернуться к списку
//           </Button>
//         </Alert>
//       </Container>
//     );
//   }

//   return (
//     <Container className="py-4">
//       {/* Хлебные крошки и кнопки действий */}
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <div>
//           <Link to="/tasks" className="text-decoration-none text-muted">
//             <FaArrowLeft className="me-2" />
//             К списку задач
//           </Link>
//           <h1 className="mt-2 mb-0">{selectedTask.title_ru}</h1>
//           <div className="text-muted">ID: #{selectedTask.id}</div>
//         </div>
        
//         {isAdmin() && (
//           <div className="d-flex gap-2">
//             <Button 
//               variant="warning"
//               as={Link}
//               to={`/tasks/${id}/edit`}
//             >
//               <FaEdit className="me-2" />
//               Редактировать
//             </Button>
//             <Button 
//               variant="danger"
//               onClick={handleDelete}
//               disabled={isDeleting}
//             >
//               <FaTrash className="me-2" />
//               {isDeleting ? 'Удаление...' : 'Удалить'}
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* Основная информация в карточках */}
//       <Row className="mb-4">
//         <Col lg={8}>
//           <Card className="mb-4">
//             <Card.Body>
//               {/* Сложность и статусы платформ */}
//               <Row className="mb-4">
//                 <Col md={6}>
//                   <div className="mb-3">
//                     <h5 className="text-muted mb-2">Сложность</h5>
//                     <DifficultyIndicator difficulty={selectedTask.difficulty} />
//                   </div>
//                 </Col>
//                 <Col md={6}>
//                   <h5 className="text-muted mb-2">Статус заливки</h5>
//                   <PlatformStatus />
//                 </Col>
//               </Row>

//               {/* Вкладки с контентом */}
//               <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
//                 <Nav variant="tabs" className="mb-3">
//                   <Nav.Item>
//                     <Nav.Link eventKey="description">Описание</Nav.Link>
//                   </Nav.Item>
//                   <Nav.Item>
//                     <Nav.Link eventKey="solution">Идея решения</Nav.Link>
//                   </Nav.Item>
//                   <Nav.Item>
//                     <Nav.Link eventKey="metadata">Метаданные</Nav.Link>
//                   </Nav.Item>
//                 </Nav>
                
//                 <Tab.Content>
//                   <Tab.Pane eventKey="description">
//                     {selectedTask.description ? (
//                       <div className="task-description">
//                         {selectedTask.description.split('\n').map((paragraph, idx) => (
//                           <p key={idx}>{paragraph}</p>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-muted text-center py-4">
//                         Описание отсутствует
//                       </div>
//                     )}
//                   </Tab.Pane>
                  
//                   <Tab.Pane eventKey="solution">
//                     {selectedTask.solution_idea ? (
//                       <div className="solution-idea">
//                         {selectedTask.solution_idea.split('\n').map((paragraph, idx) => (
//                           <p key={idx}>{paragraph}</p>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-muted text-center py-4">
//                         Идея решения отсутствует
//                       </div>
//                     )}
//                   </Tab.Pane>
                  
//                   <Tab.Pane eventKey="metadata">
//                     <Table bordered>
//                       <tbody>
//                         <tr>
//                           <td className="text-muted" style={{ width: '200px' }}>Ссылка Polygon</td>
//                           <td>
//                             {selectedTask.polygon_url ? (
//                               <a 
//                                 href={selectedTask.polygon_url} 
//                                 target="_blank" 
//                                 rel="noopener noreferrer"
//                                 className="text-decoration-none"
//                               >
//                                 {selectedTask.polygon_url}
//                                 <FaExternalLinkAlt className="ms-2" size={12} />
//                               </a>
//                             ) : (
//                               <span className="text-muted">Не указана</span>
//                             )}
//                           </td>
//                         </tr>
//                         <tr>
//                           <td className="text-muted">Примечания</td>
//                           <td>
//                             {selectedTask.note || (
//                               <span className="text-muted">Отсутствуют</span>
//                             )}
//                           </td>
//                         </tr>
//                         <tr>
//                           <td className="text-muted">Создано</td>
//                           <td>{formatDate(selectedTask.created_at)}</td>
//                         </tr>
//                         <tr>
//                           <td className="text-muted">Обновлено</td>
//                           <td>{formatDate(selectedTask.updated_at)}</td>
//                         </tr>
//                       </tbody>
//                     </Table>
//                   </Tab.Pane>
//                 </Tab.Content>
//               </Tab.Container>
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Боковая панель с дополнительной информацией */}
//         <Col lg={4}>
//           <Card className="mb-4">
//             <Card.Header>
//               <Card.Title className="mb-0">📊 Статистика</Card.Title>
//             </Card.Header>
//             <Card.Body>
//               <Table borderless size="sm">
//                 <tbody>
//                   <tr>
//                     <td className="text-muted">Статус Codeforces</td>
//                     <td className="text-end">
//                       <Badge bg={selectedTask.is_codeforces_ready ? 'success' : 'secondary'}>
//                         {selectedTask.is_codeforces_ready ? 'Готово' : 'Не готово'}
//                       </Badge>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-muted">Статус Yandex</td>
//                     <td className="text-end">
//                       <Badge bg={selectedTask.is_yandex_ready ? 'success' : 'secondary'}>
//                         {selectedTask.is_yandex_ready ? 'Готово' : 'Не готово'}
//                       </Badge>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-muted">Заполненость</td>
//                     <td className="text-end">
//                       <div className="progress" style={{ height: '6px' }}>
//                         <div 
//                           className="progress-bar bg-success" 
//                           style={{ 
//                             width: `${(
//                               (selectedTask.description ? 25 : 0) +
//                               (selectedTask.solution_idea ? 25 : 0) +
//                               (selectedTask.polygon_url ? 25 : 0) +
//                               (selectedTask.difficulty ? 25 : 0)
//                             )}%` 
//                           }}
//                         ></div>
//                       </div>
//                     </td>
//                   </tr>
//                 </tbody>
//               </Table>
//             </Card.Body>
//           </Card>

//           <Card>
//             <Card.Header>
//               <Card.Title className="mb-0">🚀 Быстрые действия</Card.Title>
//             </Card.Header>
//             <Card.Body>
//               <div className="d-grid gap-2">
//                 {selectedTask.polygon_url && (
//                   <Button 
//                     variant="outline-primary"
//                     as="a"
//                     href={selectedTask.polygon_url}
//                     target="_blank"
//                   >
//                     <FaExternalLinkAlt className="me-2" />
//                     Открыть в Polygon
//                   </Button>
//                 )}
                
//                 <Button 
//                   variant="outline-secondary"
//                   onClick={() => navigator.clipboard.writeText(window.location.href)}
//                 >
//                   📋 Скопировать ссылку
//                 </Button>
                
//                 {isAdmin() && (
//                   <>
//                     <Button 
//                       variant="outline-success"
//                       onClick={() => navigate(`/tasks/${id}/edit`)}
//                     >
//                       ✏️ Редактировать
//                     </Button>
                    
//                     <Button 
//                       variant="outline-danger"
//                       onClick={handleDelete}
//                       disabled={isDeleting}
//                     >
//                       🗑️ {isDeleting ? 'Удаление...' : 'Удалить задачу'}
//                     </Button>
//                   </>
//                 )}
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Стили для платформ
//       <style jsx="true">{`
//         .platform-indicator {
//           width: 40px;
//           height: 40px;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background-color: #e9ecef;
//           color: #6c757d;
//           font-weight: bold;
//         }
        
//         .platform-indicator.active {
//           background-color: #198754;
//           color: white;
//         }
        
//         .task-description, .solution-idea {
//           line-height: 1.6;
//           white-space: pre-wrap;
//         }
        
//         .task-description p, .solution-idea p {
//           margin-bottom: 1rem;
//         }
//       `}</style> */}
//     </Container>
//   );
// };

// export default TaskDetailPage;


import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Row, Col, Button, Spinner, Alert, 
  Badge, Container, Tab, Nav, Table, Modal
} from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import TaskContext from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import TaskForm from '../components/TaskForm'; // Импортируем TaskForm
import { toast } from 'react-toastify'; // Для уведомлений

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    selectedTask, 
    loading, 
    error, 
    fetchTaskById, 
    deleteTask,
    updateTask
  } = useContext(TaskContext);
  
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('description');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Для модального окна редактирования
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTaskById(id);
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      setIsDeleting(true);
      try {
        await deleteTask(id);
        toast.success('Задача удалена');
        navigate('/tasks');
      } catch (error) {
        console.error('Ошибка при удалении:', error);
        toast.error('Ошибка при удалении задачи');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleUpdateTask = async (taskData) => {
    setIsUpdating(true);
    try {
      await updateTask(id, taskData);
      setShowEditModal(false);
      // Обновляем данные о задаче
      await fetchTaskById(id);
    } catch (error) {
      // Ошибка уже обработана в контексте
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DifficultyIndicator = ({ difficulty }) => {
    let variant = 'secondary';
    let text = 'Средняя';
    
    if (difficulty <= 3) {
      variant = 'success';
      text = 'Легкая';
    } else if (difficulty <= 6) {
      variant = 'warning';
      text = 'Средняя';
    } else {
      variant = 'danger';
      text = 'Сложная';
    }
    
    return (
      <div className="d-flex align-items-center gap-2">
        <Badge bg={variant} className="fs-6 px-3 py-2">
          {difficulty}/10
        </Badge>
        <span className="text-muted">{text}</span>
      </div>
    );
  };

  const PlatformStatus = () => (
    <div className="d-flex gap-3 mb-4">
      <div className="d-flex align-items-center gap-2">
        <div className={`platform-indicator ${selectedTask?.is_codeforces_ready ? 'active' : ''}`}>
          <span className="platform-icon">CF</span>
        </div>
        <div>
          <div className="fw-bold">Codeforces</div>
          <div className="text-muted small">
            {selectedTask?.is_codeforces_ready 
              ? 'Готова для заливки' 
              : 'Не готова'}
          </div>
        </div>
      </div>
      
      <div className="d-flex align-items-center gap-2">
        <div className={`platform-indicator ${selectedTask?.is_yandex_ready ? 'active' : ''}`}>
          <span className="platform-icon">Y</span>
        </div>
        <div>
          <div className="fw-bold">Yandex Contest</div>
          <div className="text-muted small">
            {selectedTask?.is_yandex_ready 
              ? 'Готова для заливки' 
              : 'Не готова'}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && !selectedTask) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Загрузка задачи...</p>
      </Container>
    );
  }

  if (error && !selectedTask) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Ошибка загрузки задачи</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-primary" as={Link} to="/tasks">
              <FaArrowLeft className="me-2" />
              Вернуться к списку
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!selectedTask) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          <Alert.Heading>Задача не найдена</Alert.Heading>
          <p>Задача с ID {id} не существует или была удалена.</p>
          <hr />
          <Button variant="primary" as={Link} to="/tasks">
            <FaArrowLeft className="me-2" />
            Вернуться к списку
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-4">
        {/* Хлебные крошки и кнопки действий */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Link to="/tasks" className="text-decoration-none text-muted">
              <FaArrowLeft className="me-2" />
              К списку задач
            </Link>
            <h1 className="mt-2 mb-0">{selectedTask.title_ru}</h1>
            <div className="text-muted">ID: #{selectedTask.id}</div>
          </div>
          
          {isAdmin() && (
            <div className="d-flex gap-2">
              <Button 
                variant="warning"
                onClick={() => setShowEditModal(true)}
              >
                <FaEdit className="me-2" />
                Редактировать
              </Button>
              <Button 
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <FaTrash className="me-2" />
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </Button>
            </div>
          )}
        </div>

        {/* Основная информация в карточках */}
        <Row className="mb-4">
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Body>
                {/* Сложность и статусы платформ */}
                <Row className="mb-4">
                  <Col md={6}>
                    <div className="mb-3">
                      <h5 className="text-muted mb-2">Сложность</h5>
                      <DifficultyIndicator difficulty={selectedTask.difficulty} />
                    </div>
                  </Col>
                  <Col md={6}>
                    <h5 className="text-muted mb-2">Статус заливки</h5>
                    <PlatformStatus />
                  </Col>
                </Row>

                {/* Вкладки с контентом */}
                <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                  <Nav variant="tabs" className="mb-3">
                    <Nav.Item>
                      <Nav.Link eventKey="description">Описание</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="solution">Идея решения</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="metadata">Метаданные</Nav.Link>
                    </Nav.Item>
                  </Nav>
                  
                  <Tab.Content>
                    <Tab.Pane eventKey="description">
                      {selectedTask.description ? (
                        <div className="task-description">
                          {selectedTask.description.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted text-center py-4">
                          Описание отсутствует
                        </div>
                      )}
                    </Tab.Pane>
                    
                    <Tab.Pane eventKey="solution">
                      {selectedTask.solution_idea ? (
                        <div className="solution-idea">
                          {selectedTask.solution_idea.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted text-center py-4">
                          Идея решения отсутствует
                        </div>
                      )}
                    </Tab.Pane>
                    
                    <Tab.Pane eventKey="metadata">
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td className="text-muted" style={{ width: '200px' }}>Ссылка Polygon</td>
                            <td>
                              {selectedTask.polygon_url ? (
                                <a 
                                  href={selectedTask.polygon_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-decoration-none"
                                >
                                  {selectedTask.polygon_url}
                                  <FaExternalLinkAlt className="ms-2" size={12} />
                                </a>
                              ) : (
                                <span className="text-muted">Не указана</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Примечания</td>
                            <td>
                              {selectedTask.note || (
                                <span className="text-muted">Отсутствуют</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Создано</td>
                            <td>{formatDate(selectedTask.created_at)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Обновлено</td>
                            <td>{formatDate(selectedTask.updated_at)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>
          </Col>

          {/* Боковая панель с дополнительной информацией */}
          <Col lg={4}>
            <Card className="mb-4">
              <Card.Header>
                <Card.Title className="mb-0">📊 Статистика</Card.Title>
              </Card.Header>
              <Card.Body>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td className="text-muted">Статус Codeforces</td>
                      <td className="text-end">
                        <Badge bg={selectedTask.is_codeforces_ready ? 'success' : 'secondary'}>
                          {selectedTask.is_codeforces_ready ? 'Готово' : 'Не готово'}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Статус Yandex</td>
                      <td className="text-end">
                        <Badge bg={selectedTask.is_yandex_ready ? 'success' : 'secondary'}>
                          {selectedTask.is_yandex_ready ? 'Готово' : 'Не готово'}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Заполненость</td>
                      <td className="text-end">
                        <div className="progress" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{ 
                              width: `${(
                                (selectedTask.description ? 25 : 0) +
                                (selectedTask.solution_idea ? 25 : 0) +
                                (selectedTask.polygon_url ? 25 : 0) +
                                (selectedTask.difficulty ? 25 : 0)
                              )}%` 
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title className="mb-0">🚀 Быстрые действия</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  {selectedTask.polygon_url && (
                    <Button 
                      variant="outline-primary"
                      as="a"
                      href={selectedTask.polygon_url}
                      target="_blank"
                    >
                      <FaExternalLinkAlt className="me-2" />
                      Открыть в Polygon
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline-secondary"
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                  >
                    📋 Скопировать ссылку
                  </Button>
                  
                  {isAdmin() && (
                    <>
                      <Button 
                        variant="outline-success"
                        onClick={() => setShowEditModal(true)}
                      >
                        ✏️ Редактировать
                      </Button>
                      
                      <Button 
                        variant="outline-danger"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        🗑️ {isDeleting ? 'Удаление...' : 'Удалить задачу'}
                      </Button>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Модальное окно редактирования */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>✏️ Редактирование задачи</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TaskForm 
            initialData={selectedTask}
            onSubmit={handleUpdateTask}
            loading={isUpdating}
            onCancel={() => setShowEditModal(false)}
            isEdit={true}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TaskDetailPage;