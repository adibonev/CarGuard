import axios from 'axios';

// Използвай локалния сървър при development, production URL в production
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://web-production-2e60.up.railway.app/api';

console.log('API URL:', API_URL, 'ENV:', process.env.NODE_ENV);

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Обработка на 401 грешки - автоматичен logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токенът е невалиден или изтекъл - изчисти и пренасочи
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Пренасочи към login само ако не сме вече там
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/me'),
  updateReminderDays: (reminderDays) =>
    api.put('/auth/reminder-days', { reminderDays })
};

export const carsAPI = {
  getCars: () => api.get('/cars'),
  addCar: (carData) =>
    api.post('/cars', carData),
  updateCar: (id, carData) =>
    api.put(`/cars/${id}`, carData),
  deleteCar: (id) => api.delete(`/cars/${id}`),
  decodeVin: (vin) => api.get(`/cars/decode-vin/${vin}`)
};

export const servicesAPI = {
  getServices: (carId) => api.get(`/services/car/${carId}`),
  getAllServices: () => api.get('/services/all'),
  addService: (carId, serviceType, expiryDate, cost) =>
    api.post('/services', { carId, serviceType, expiryDate, cost }),
  updateService: (id, serviceType, expiryDate, cost) =>
    api.put(`/services/${id}`, { serviceType, expiryDate, cost }),
  deleteService: (id) => api.delete(`/services/${id}`)
};

export default api;

