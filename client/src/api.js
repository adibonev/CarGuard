import axios from 'axios';

const API_URL = 'https://web-production-2e60.up.railway.app/api';

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
  deleteCar: (id) => api.delete(`/cars/${id}`)
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

