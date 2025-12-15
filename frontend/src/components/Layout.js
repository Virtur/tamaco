import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">
            Tamaco App
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/tasks" active={location.pathname === '/tasks'}>
                🗂️ Задачи
              </Nav.Link>
              
              {isAdmin() && (
                <Nav.Link as={Link} to="/admin" active={location.pathname.startsWith('/admin')}>
                  ⚙️ Админ-панель
                </Nav.Link>
              )}
            </Nav>
            
            <Nav>
              {isAuthenticated ? (
                <>
                  <Navbar.Text className="me-3">
                    👤 {user?.login} ({user?.role})
                  </Navbar.Text>
                  <Button variant="outline-light" size="sm" onClick={handleLogout}>
                    Выйти
                  </Button>
                </>
              ) : (
                <Button 
                  as={Link} 
                  to="/login" 
                  variant="outline-light" 
                  size="sm"
                  active={location.pathname === '/login'}
                >
                  Войти
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <main>
        {children}
      </main>
      
      <footer className="mt-5 py-3 bg-light text-center">
        <Container>
          <p className="mb-0 text-muted">
            © 2025 Tamaco • Учебный проект по базам данных
          </p>
        </Container>
      </footer>
    </>
  );
};

export default Layout;