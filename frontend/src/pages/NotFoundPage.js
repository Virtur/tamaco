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