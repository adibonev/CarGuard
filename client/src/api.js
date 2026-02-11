import axios from 'axios';

// Use REACT_APP_API_URL from the .env file
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API URL:', API_URL);

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

// Handle 401 errors - automatic logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired - clear and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login only if we are not already there
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
    api.put('/auth/reminder-days', { reminderDays }),
  updateReminderEnabled: (reminderEnabled) =>
    api.put('/auth/reminder-enabled', { reminderEnabled })
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

