import React, { useState, useEffect } from 'react';
import { carsAPI, servicesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import CarList from '../components/CarList';
import CarForm from '../components/CarForm';
import ServiceList from '../components/ServiceList';
import ServiceForm from '../components/ServiceForm';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [services, setServices] = useState([]);
  const [showCarForm, setShowCarForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    if (selectedCar) {
      loadServices(selectedCar._id);
    }
  }, [selectedCar]);

  const loadCars = async () => {
    try {
      setLoading(true);
      const response = await carsAPI.getCars();
      setCars(response.data);
    } catch (err) {
      console.error('Error loading cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (carId) => {
    try {
      const response = await servicesAPI.getServices(carId);
      setServices(response.data);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const handleAddCar = async (carData) => {
    try {
      await carsAPI.addCar(
        carData.brand,
        carData.model,
        carData.year,
        carData.licensePlate
      );
      loadCars();
      setShowCarForm(false);
    } catch (err) {
      console.error('Error adding car:', err);
    }
  };

  const handleDeleteCar = async (carId) => {
    try {
      await carsAPI.deleteCar(carId);
      loadCars();
      setSelectedCar(null);
    } catch (err) {
      console.error('Error deleting car:', err);
    }
  };

  const handleAddService = async (serviceData) => {
    try {
      await servicesAPI.addService(
        selectedCar._id,
        serviceData.serviceType,
        serviceData.expiryDate
      );
      loadServices(selectedCar._id);
      setShowServiceForm(false);
    } catch (err) {
      console.error('Error adding service:', err);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await servicesAPI.deleteService(serviceId);
      loadServices(selectedCar._id);
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🚗 Car Checker</h1>
        <div className="header-right">
          <span>Привет, {user?.name}!</span>
          <button onClick={logout} className="logout-btn">Изход</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="cars-section">
          <h2>Моите Автомобили</h2>
          <button 
            className="add-btn"
            onClick={() => setShowCarForm(!showCarForm)}
          >
            + Добави Автомобил
          </button>

          {showCarForm && (
            <CarForm onSubmit={handleAddCar} onCancel={() => setShowCarForm(false)} />
          )}

          {loading ? (
            <p>Зареждане...</p>
          ) : (
            <CarList
              cars={cars}
              selectedCar={selectedCar}
              onSelectCar={setSelectedCar}
              onDeleteCar={handleDeleteCar}
            />
          )}
        </div>

        {selectedCar && (
          <div className="services-section">
            <h2>Услуги за {selectedCar.brand} {selectedCar.model} ({selectedCar.year})</h2>
            <button 
              className="add-btn"
              onClick={() => setShowServiceForm(!showServiceForm)}
            >
              + Добави Услуга
            </button>

            {showServiceForm && (
              <ServiceForm
                onSubmit={handleAddService}
                onCancel={() => setShowServiceForm(false)}
              />
            )}

            <ServiceList
              services={services}
              onDeleteService={handleDeleteService}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
