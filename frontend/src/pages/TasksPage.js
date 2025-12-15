import React, { useState, useEffect, useContext } from 'react';
import { 
  Table, Button, Card, Row, Col, Form, 
  InputGroup, Spinner, Alert, Badge, Modal,
  Pagination
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import TaskContext from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import TaskFilter from '../components/TaskFilter';
import TaskForm from '../components/TaskForm';

// Подключаем данные по задачам
const TasksPage = () => {
  const { 
    tasks, 
    loading, 
    error, 
    pagination, 
    fetchTasks, 
    deleteTask,
    createTask,
    updateTask,
    filterTasks
  } = useContext(TaskContext);
  
  const { isAuthenticated, isAdmin } = useAuth();
  
  // Создаем состояния для управления
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  
  // Получаем данные по задачам
  useEffect(() => {
    fetchTasks(pagination.page, pagination.limit);
  }, [fetchTasks, pagination.limit, pagination.page]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      await deleteTask(id);
    }
  };

  const handleCreateTask = async (taskData) => {
    const result = await createTask(taskData);
    if (result.success) {
      setShowCreateModal(false);
    }
  };

  const handleUpdateTask = async (taskData) => {
    const result = await updateTask(editingTask.id, taskData);
    if (result.success) {
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  const handleFilter = async (filters) => {
    setFilterActive(true);
    await filterTasks(filters);
  };

  const handleClearFilter = async () => {
    setFilterActive(false);
    await fetchTasks(1, pagination.limit);
  };

  const filteredTasks = tasks.filter(task =>
    task.title_ru.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const DifficultyBadge = ({ difficulty }) => {
    let variant = 'secondary';
    if (difficulty <= 3) variant = 'success';
    else if (difficulty <= 6) variant = 'warning';
    else variant = 'danger';
    
    return <Badge bg={variant}>{difficulty}/10</Badge>;
  };

  const PlatformBadges = ({ task }) => (
    <div className="d-flex gap-1">
      {task.is_codeforces_ready && <Badge bg="primary">CF</Badge>}
      {task.is_yandex_ready && <Badge bg="warning" text="dark">Yandex</Badge>}
    </div>
  );

  const handlePageChange = (page) => {
    fetchTasks(page, pagination.limit);
  };

  return (
    <div>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>📋 Список задач</h1>
          <p className="text-muted">
            Всего задач: {pagination.total} 
            {filterActive && ' (отфильтровано)'}
          </p>
        </Col>
        
        <Col md="auto">
          <InputGroup>
            <Form.Control
              placeholder="Поиск задач..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <Button variant="outline-secondary">
              🔍
            </Button>
          </InputGroup>
        </Col>
        
        {isAdmin() && (
          <Col md="auto">
            <Button 
              variant="success" 
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Новая задача
            </Button>
          </Col>
        )}
      </Row>

      {/* Фильтры */}
      <Card className="mb-4">
        <Card.Body>
          <TaskFilter 
            onFilter={handleFilter}
            onClear={handleClearFilter}
            isActive={filterActive}
          />
        </Card.Body>
      </Card>

      {/* Ошибка */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Загрузка */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Загрузка задач...</p>
        </div>
      ) : (
        <>
          {/* Таблица задач */}
          <Card>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Сложность</th>
                    <th>Платформы</th>
                    <th>Теги</th>
                    <th> Контесты</th>
                    <th>Создано</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        {searchTerm ? 'Задачи не найдены' : 'Нет задач'}
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id}>
                        <td>#{task.id}</td>
                        <td>
                          <Link to={`/tasks/${task.id}`} className="text-decoration-none">
                            {task.title_ru}
                          </Link>
                          {task.description && (
                            <div className="text-muted small mt-1">
                              {task.description.substring(0, 80)}...
                            </div>
                          )}
                        </td>
                        <td>
                          <DifficultyBadge difficulty={task.difficulty} />
                        </td>
                        <td>
                          <PlatformBadges task={task} />
                        </td>
                        <td>
                          {task.tags && (
                            <div className="d-flex flex-wrap gap-1">
                              {task.tags.split(',').slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} bg="light" text="dark" className="border">
                                  {tag}
                                </Badge>
                              ))}
                              {task.tags.split(',').length > 3 && (
                                <Badge bg="light" text="dark" className="border">
                                  +{task.tags.split(',').length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {task.contests && (
                            <div className="d-flex flex-wrap gap-1">
                              {task.contests.split(',').slice(0, 3).map((contest, idx) => (
                                <Badge key={idx} bg="dark" text="light" className="border">
                                  {contest}
                                </Badge>
                              ))}
                              {task.contests.split(',').length > 3 && (
                                <Badge bg="light" text="dark" className="border">
                                  +{task.contests.split(',').length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(task.created_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              as={Link}
                              to={`/tasks/${task.id}`}
                              variant="outline-primary"
                              size="sm"
                            >
                              👁️
                            </Button>
                            
                            {isAdmin() && (
                              <>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setShowEditModal(true);
                                  }}
                                >
                                  ✏️
                                </Button>
                                
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(task.id)}
                                >
                                  🗑️
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Пагинация */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={pagination.page === 1}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(pagination.page - 1)} 
                  disabled={pagination.page === 1}
                />
                
                {[...Array(pagination.totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === pagination.page}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => handlePageChange(pagination.page + 1)} 
                  disabled={pagination.page === pagination.totalPages}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(pagination.totalPages)} 
                  disabled={pagination.page === pagination.totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* ====== Модальные окна ====== */}
      {/* Окно создания задачи */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>➕ Новая задача</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TaskForm 
            onSubmit={handleCreateTask}
            loading={loading}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal.Body>
      </Modal>

      {/* Окно редактирования задачи */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>✏️ Редактирование задачи</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingTask && (
            <TaskForm 
              initialData={editingTask}
              onSubmit={handleUpdateTask}
              loading={loading}
              onCancel={() => {
                setShowEditModal(false);
                setEditingTask(null);
              }}
              isEdit
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TasksPage;