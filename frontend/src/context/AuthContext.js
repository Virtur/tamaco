import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL;

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Конфигурация axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.id,
        login: decoded.login,
        role: decoded.role
      });
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  // Вход в систему
  const login = async (login, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        login,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        return { success: true, user };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Ошибка входа' 
      };
    }
  };

  // Выход из системы
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Проверка токена
  const checkAuth = async () => {
    if (!token) return false;
    
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      if (response.data.success) {
        setUser(response.data.user);
        return true;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
      return false;
    }
  };

  // Проверка роли администратора
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    checkAuth,
    isAdmin,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;