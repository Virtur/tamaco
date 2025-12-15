import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/tasks';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authLogin(login, password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Тестовые данные для быстрого входа (поменять, если изменяться)
  const fillTestCredentials = (userType) => {
    if (userType === 'admin') {
      setLogin('admin');
      setPassword('admin123');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card>
            <Card.Body>
              <Card.Title className="text-center mb-4">🔐 Вход в систему</Card.Title>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Логин</Form.Label>
                  <Form.Control
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                    placeholder="Введите логин"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Пароль</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Введите пароль"
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'Вход...' : 'Войти'}
                  </Button>
                </div>
              </Form>
              
              <div className="mt-3 text-center">
                <small className="text-muted">Тестовые пользователи:</small>
                <div className="mt-2">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => fillTestCredentials('admin')}
                  >
                    👑 Админ (admin/admin123)
                  </Button>
                </div>
              </div>
              
              <Card.Text className="text-center mt-4 text-muted small">
                Для демонстрации используйте тестовые данные выше
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;