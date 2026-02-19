import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import { getBrandLogo } from '../data/brandLogos';

const Overview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cars, services, allServices,
    stats, setShowCarForm, openCarPicker,
    isExpiringType, getServiceStatus, getServiceName,
    reminderSettings, reminderDays,
  } = useDashboard();

  return (
    <div className="tab-content-staging">
      {/* Welcome Header */}
      <div className="welcome-header">
        <h1><i className="bi bi-emoji-smile"></i> Welcome back, {user?.name || user?.email?.split('@')[0]}!</h1>
        <p>Here's an overview of your vehicles and upcoming services</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="bi bi-car-front-fill"></i></div>
          <div className="stat-value">{stats.totalCars.toLocaleString('en-US')}</div>
          <div className="stat-label">Vehicles</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
          <div className="stat-value">{stats.upcomingServices.toLocaleString('en-US')}</div>
          <div className="stat-label">Upcoming Deadlines</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="bi bi-check-circle-fill"></i></div>
          <div className="stat-value">{stats.totalServices.toLocaleString('en-US')}</div>
          <div className="stat-label">Completed Services</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="bi bi-cash-coin"></i></div>
          <div className="stat-value">{Math.round(stats.totalCosts).toLocaleString('en-US')}</div>
          <div className="stat-label">Total Costs (€)</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="quick-action-btn" onClick={() => { navigate('/dashboard/vehicles'); setShowCarForm(true); }}>
          <i className="bi bi-plus-circle-fill"></i>
          <h4>Add Vehicle</h4>
        </div>
        <div className="quick-action-btn" onClick={() => openCarPicker('service')}>
          <i className="bi bi-wrench"></i>
          <h4>Add Service</h4>
        </div>
        <div className="quick-action-btn" onClick={() => openCarPicker('pdf')}>
          <i className="bi bi-file-pdf"></i>
          <h4>Generate Report</h4>
        </div>
        <div className="quick-action-btn" onClick={() => navigate('/dashboard/settings')}>
          <i className="bi bi-gear"></i>
          <h4>Settings</h4>
        </div>
      </div>

      {/* Notifications */}
      {allServices.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title"><i className="bi bi-bell-fill"></i> Important Reminders</h2>
          </div>
          {allServices.filter(s => isExpiringType(s.serviceType)).slice(0, 5).map(service => {
            const status = getServiceStatus(service.expiryDate, service.serviceType);
            const daysDiff = Math.ceil((new Date(service.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            const car = cars.find(c => c.id === service.carId);
            return (
              <div key={service.id} className={`notification-item ${status.status === 'expired' ? 'urgent' : ''}`}>
                <i className={`bi bi-${status.status === 'expired' ? 'exclamation-triangle-fill' : 'info-circle-fill'}`}></i>
                <div className="notification-content">
                  <h5>{getServiceName(service.serviceType)} for {car?.brand} {car?.model} expires in {daysDiff < 0 ? 0 : daysDiff} day(s){status.status === 'expired' ? '!' : ''}</h5>
                  <p>Deadline: {new Date(service.expiryDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cars Preview */}
      {cars.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title"><i className="bi bi-car-front"></i> My Vehicles</h2>
            <button className="btn-outline-custom" onClick={() => navigate('/dashboard/vehicles')}>
              View all <i className="bi bi-arrow-right"></i>
            </button>
          </div>
          <div className="cars-grid">
            {cars.slice(0, 3).map(car => (
              <div key={car.id} className="car-card">
                {getBrandLogo(car.brand)
                  ? <img src={getBrandLogo(car.brand)} alt={car.brand} className="car-icon" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  : <i className="car-icon bi bi-car-front-fill"></i>
                }
                <h3>{car.brand} {car.model}</h3>
                <div className="car-info-item"><i className="bi bi-calendar-check"></i><span>Year: {car.year}</span></div>
                <div className="car-info-item"><i className="bi bi-hash"></i><span>Plate: {car.licensePlate}</span></div>
                {car.mileage && (
                  <div className="car-info-item"><i className="bi bi-speedometer"></i><span>{car.mileage.toLocaleString()} km</span></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
