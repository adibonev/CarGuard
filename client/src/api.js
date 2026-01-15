import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password })
};

export const carsAPI = {
  getCars: () => api.get('/cars'),
  addCar: (brand, model, year, licensePlate) =>
    api.post('/cars', { brand, model, year, licensePlate }),
  updateCar: (id, brand, model, year, licensePlate) =>
    api.put(`/cars/${id}`, { brand, model, year, licensePlate }),
  deleteCar: (id) => api.delete(`/cars/${id}`)
};

export const servicesAPI = {
  getServices: (carId) => api.get(`/services/car/${carId}`),
  addService: (carId, serviceType, expiryDate) =>
    api.post('/services', { carId, serviceType, expiryDate }),
  updateService: (id, serviceType, expiryDate) =>
    api.put(`/services/${id}`, { serviceType, expiryDate }),
  deleteService: (id) => api.delete(`/services/${id}`)
};

export default api;
