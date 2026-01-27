import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isInitialized, setIsInitialized] = useState(false);

  // На първо зареждане на приложението
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsInitialized(true);
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateReminderDays = async (reminderDays) => {
    try {
      const response = await authAPI.updateReminderDays(reminderDays);
      const updatedUser = { ...user, reminderDays: response.data.reminderDays };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return response.data;
    } catch (err) {
      console.error('Error updating reminder days:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateReminderDays, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

