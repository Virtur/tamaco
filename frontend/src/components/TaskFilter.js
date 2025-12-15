import React, { useState, useEffect, useContext } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import TagContext from '../context/TagContext';



const TaskFilter = ({ onFilter, onClear, isActive }) => {

  // Подключаем данные по тегам
    const {
    tags,
    fetchTags, 
  } = useContext(TagContext);

  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(10);
  const [selectedTags, setSelectedTags] = useState([]);

  // Теги для тестирования
  // const [availableTags, setAvailableTags] = useState([
  //   { id: 1, name: 'mod' },
  //   { id: 2, name: 'algorithms' },
  //   { id: 3, name: 'math' },
  //   { id: 4, name: 'c++' },
  //   { id: 5, name: 'logic' }
  // ]);

  // Получаем данные по тегам
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // делаем теги доступными локально
  const availableTags = tags;

  const handleTagToggle = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter({
      min: minDifficulty,
      max: maxDifficulty,
      tags: selectedTags.join() //преобразуем массив в строку
    });
  };

  const handleClear = () => {
    setMinDifficulty(1);
    setMaxDifficulty(10);
    setSelectedTags([]);
    onClear();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h6 className="mb-3">🔍 Фильтр задач</h6>
      
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Сложность от</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="10"
              value={minDifficulty}
              onChange={(e) => setMinDifficulty(parseInt(e.target.value) || 1)}
            />
          </Form.Group>
        </Col>
        
        <Col md={3}>
          <Form.Group>
            <Form.Label>Сложность до</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="10"
              value={maxDifficulty}
              onChange={(e) => setMaxDifficulty(parseInt(e.target.value) || 10)}
            />
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group>
            <Form.Label>Теги</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <Button
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "primary" : "outline-primary"}
                  size="sm"
                  onClick={() => handleTagToggle(tag.id)}
                  className="mb-1"
                >
                  {tag.name}
                  {selectedTags.includes(tag.id) && ' ✓'}
                </Button>
              ))}
            </div>
          </Form.Group>
        </Col>
      </Row>
      
      <div className="d-flex justify-content-between">
        <div>
          <Button 
            type="submit" 
            variant="primary"
            size="sm"
          >
            Применить фильтр
          </Button>
          
          {isActive && (
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-2"
              onClick={handleClear}
            >
              ✕ Сбросить
            </Button>
          )}
        </div>
        
        <div className="text-muted small">
          Выбрано тегов: {selectedTags.length}
        </div>
      </div>
    </Form>
  );
};

export default TaskFilter;