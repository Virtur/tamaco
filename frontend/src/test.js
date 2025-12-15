// src/test-context.js
import React, { createContext, useContext } from 'react';

// 1. Создаем контекст
const TestContext = createContext();

// 2. Создаем Provider С value
const TestProvider = ({ children }) => {
  const value = { message: 'Привет из контекста!' };
  
  return (
    <TestContext.Provider value={value}> {/* ⭐ ЕСТЬ value! ⭐ */}
      {children}
    </TestContext.Provider>
  );
};

// 3. Хук для использования
const useTest = () => useContext(TestContext);

// 4. Компонент использующий контекст
const TestComponent = () => {
  const { message } = useTest();
  return <div>{message}</div>;
};

// 5. Приложение
const TestApp = () => (
  <TestProvider>
    <TestComponent />
  </TestProvider>
);

export default TestApp;