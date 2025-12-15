import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Row, Col, FloatingLabel } from 'react-bootstrap';
import TagContext from '../context/TagContext';
import ContestContext from '../context/ContestContext';
import { toast } from 'react-toastify';


const TaskForm = ({ 
  initialData = {}, 
  onSubmit, 
  loading, 
  onCancel,
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    title_ru: '',
    description: '',
    solution_idea: '',
    polygon_url: '',
    difficulty: 5,
    note: '',
    tags: [],
    contests: []
  });

  // Теги для тестирования
  // const [availableTags, setAvailableTags] = useState([
  //   { id: 1, name: 'mod' },
  //   { id: 2, name: 'algorithms' },
  //   { id: 3, name: 'math' },
  //   { id: 4, name: 'c++' },
  //   { id: 5, name: 'logic' }
  // ]);

    // Контесты для тестирования
  // const [availableContests] = useState([
  //   { id: 1, name: 'Python 5-7 Start (2025)', year: 2024 },
  //   { id: 2, name: '0 TX Операции с числами (2025)', year: 2023 },
  //   { id: 3, name: 'Python 5-7 Самостоятельная работа (2024)', year: 2023 }
  // ]);

  // Подключаем данные по тегам
    const {
    tags,
    fetchTags, 
  } = useContext(TagContext);
  
  // Подключаем данные по контестам
    const {
    contests,
    fetchContests, 
  } = useContext(ContestContext);

  // Получаем данные по тегам
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);
  // делаем теги доступными локально
  const availableTags = tags;

  // Получаем данные по контестам
  useEffect(() => {
    fetchContests();
  }, [fetchContests]);
  // делаем контесты доступными локально
  const availableContests = contests;

  useEffect(() => {
  if (initialData && Object.keys(initialData).length > 0) {
    // Функция для безопасного получения массива ID
    const getIdsArray = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) {
        return data.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      }
      return [];
    };

    setFormData({
      title_ru: initialData.title_ru || '',
      description: initialData.description || '',
      solution_idea: initialData.solution_idea || '',
      polygon_url: initialData.polygon_url || '',
      difficulty: initialData.difficulty || 5,
      note: initialData.note || '',
      tags: getIdsArray(initialData.tags || initialData.tag_ids),
      contests: getIdsArray(initialData.contests || initialData.contest_ids)
    });
  }
}, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleContestToggle = (contestId) => {
    setFormData(prev => ({
      ...prev,
      contests: prev.contests.includes(contestId)
        ? prev.contests.filter(id => id !== contestId)
        : [...prev.contests, contestId]
    }));
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   onSubmit(formData);
  // };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Валидация с toast
    if (!formData.title_ru.trim()) {
      toast.error('Пожалуйста, введите название задачи');
      return;
    }
    
    if (formData.difficulty < 1 || formData.difficulty > 10) {
      toast.error('Сложность должна быть от 1 до 10');
      return;
    }
    
    // Показываем toast перед отправкой
    const successToast = toast.success(isEdit ? 'Задача обновлена' : 'Задача создана');
    
    // Вызываем onSubmit
    onSubmit(formData, successToast);
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Название задачи *</Form.Label>
        <Form.Control
          type="text"
          name="title_ru"
          value={formData.title_ru}
          onChange={handleChange}
          required
          placeholder="Введите название задачи"
        />
      </Form.Group>

      <Row className="mb-3">
        <Col md={6}>
          <FloatingLabel label="Описание задачи" className="mb-3">
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Описание задачи"
              style={{ height: '150px' }}
            />
          </FloatingLabel>
        </Col>
        
        <Col md={6}>
          <FloatingLabel label="Идея решения" className="mb-3">
            <Form.Control
              as="textarea"
              name="solution_idea"
              value={formData.solution_idea}
              onChange={handleChange}
              placeholder="Идея решения"
              style={{ height: '150px' }}
            />
          </FloatingLabel>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={8}>
          <Form.Group>
            <Form.Label>URL задачи на Polygon/Codeforces</Form.Label>
            <Form.Control
              type="url"
              name="polygon_url"
              value={formData.polygon_url}
              onChange={handleChange}
              placeholder="https://polygon.codeforces.com/..."
            />
            <Form.Text className="text-muted">
              Ссылка для автоматической проверки решений
            </Form.Text>
          </Form.Group>
        </Col>
        
        <Col md={4}>
          <Form.Group>
            <Form.Label>Сложность (1-10)</Form.Label>
            <Form.Control
              type="number"
              name="difficulty"
              min="1"
              max="10"
              value={formData.difficulty}
              onChange={handleChange}
              required
            />
            <Form.Range
              min="1"
              max="10"
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                difficulty: parseInt(e.target.value) 
              }))}
              className="mt-2"
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Теги</Form.Label>
        <div className="d-flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <Button
              key={tag.id}
              variant={formData.tags.includes(tag.id) ? "success" : "outline-secondary"}
              size="sm"
              type="button"
              onClick={() => handleTagToggle(tag.id)}
              className="mb-1"
            >
              {tag.name}
              {formData.tags.includes(tag.id) && ' ✓'}
            </Button>
          ))}
        </div>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Контесты</Form.Label>
        <div className="d-flex flex-wrap gap-2">
          {availableContests.map(contest => (
            <Button
              key={contest.id}
              variant={formData.contests.includes(contest.id) ? "warning" : "outline-secondary"}
              size="sm"
              type="button"
              onClick={() => handleContestToggle(contest.id)}
              className="mb-1"
            >
              {contest.name} ({contest.year})
              {formData.contests.includes(contest.id) && ' ✓'}
            </Button>
          ))}
        </div>
      </Form.Group>

      <FloatingLabel label="Примечания" className="mb-4">
        <Form.Control
          as="textarea"
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Дополнительные заметки"
          style={{ height: '100px' }}
        />
      </FloatingLabel>

      <div className="d-flex justify-content-end gap-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Отмена
        </Button>
        
        <Button
          variant={isEdit ? "warning" : "success"}
          type="submit"
          disabled={loading || !formData.title_ru.trim()}
        >
          {loading ? 'Сохранение...' : (isEdit ? 'Обновить задачу' : 'Создать задачу')}
        </Button>
      </div>
    </Form>
  );
};

export default TaskForm;