import React, { useState, useEffect } from 'react';
import { carsAPI, servicesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import CarForm from '../components/CarForm';
import ServiceForm from '../components/ServiceForm';
import { getBrandLogo } from '../data/brandLogos';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [services, setServices] = useState([]);
  const [showCarForm, setShowCarForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reminderDays, setReminderDays] = useState(() => {
    const saved = localStorage.getItem('reminderDays');
    return saved ? parseInt(saved) : 30;
  });
  const { user, logout } = useAuth();

  const handleReminderDaysChange = (days) => {
    const value = parseInt(days);
    setReminderDays(value);
    localStorage.setItem('reminderDays', value.toString());
  };

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    if (selectedCar) {
      loadServices(selectedCar.id);
    }
  }, [selectedCar]);

  const loadCars = async () => {
    try {
      setLoading(true);
      const response = await carsAPI.getCars();
      setCars(response.data);
      if (response.data.length > 0 && !selectedCar) {
        setSelectedCar(response.data[0]);
      }
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
      if (editingCar) {
        // Редактиране
        await carsAPI.updateCar(
          editingCar.id,
          carData.brand,
          carData.model,
          carData.year
        );
        setEditingCar(null);
      } else {
        // Добавяне
        await carsAPI.addCar(
          carData.brand,
          carData.model,
          carData.year
        );
      }
      loadCars();
      setShowCarForm(false);
    } catch (err) {
      console.error('Error saving car:', err);
    }
  };

  const handleEditCar = (car) => {
    setEditingCar(car);
    setShowCarForm(true);
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Сигурен ли си, че искаш да изтриеш този автомобил?')) {
      return;
    }
    try {
      await carsAPI.deleteCar(carId);
      loadCars();
      if (selectedCar?.id === carId) {
        setSelectedCar(null);
      }
    } catch (err) {
      console.error('Error deleting car:', err);
    }
  };

  const handleCarChangeForService = (carId) => {
    const car = cars.find(c => c.id === parseInt(carId));
    if (car) {
      setSelectedCar(car);
    }
  };

  const handleAddService = async (serviceData) => {
    try {
      console.log('Adding service:', serviceData);
      await servicesAPI.addService(
        selectedCar.id,
        serviceData.serviceType,
        serviceData.expiryDate
      );
      loadServices(selectedCar.id);
      setShowServiceForm(false);
    } catch (err) {
      console.error('Error adding service:', err);
      alert('Грешка при добавяне на услуга: ' + (err.response?.data?.errors?.[0]?.msg || err.message));
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Сигурен ли си, че искаш да изтриеш тази услуга?')) {
      return;
    }
    try {
      await servicesAPI.deleteService(serviceId);
      loadServices(selectedCar.id);
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  const getServiceIcon = (type) => {
    const icons = {
      'гражданска': '🛡️',
      'винетка': '🛣️',
      'преглед': '🔧',
      'каско': '💎',
      'данък': '💰'
    };
    return icons[type] || '📋';
  };

  const getServiceName = (type) => {
    const names = {
      'гражданска': 'Гражданска отговорност',
      'винетка': 'Винетка',
      'преглед': 'Технически преглед',
      'каско': 'КАСКО',
      'данък': 'Данък МПС'
    };
    return names[type] || type;
  };

  const getServiceStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', text: 'Изтекъл!', class: 'status-expired' };
    if (daysLeft <= reminderDays) return { status: 'warning', text: `${daysLeft} дни`, class: 'status-warning' };
    return { status: 'ok', text: `${daysLeft} дни`, class: 'status-ok' };
  };

  const getExpiringServices = () => {
    return services.filter(s => {
      const status = getServiceStatus(s.expiryDate);
      return status.status === 'warning' || status.status === 'expired';
    });
  };

  const renderDashboard = () => (
    <div className="tab-content dashboard-overview">
      <div className="overview-header">
        <h2>👋 Добре дошъл, {user?.name}!</h2>
        <p>Ето преглед на твоите автомобили и услуги</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-info">
            <div className="stat-number">{cars.length}</div>
            <div className="stat-label">Автомобили</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-number">{services.length}</div>
            <div className="stat-label">Услуги</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-number">{getExpiringServices().length}</div>
            <div className="stat-label">Изтичащи скоро</div>
          </div>
        </div>
      </div>

      {selectedCar && (
        <div className="quick-view">
          <h3>🚘 {selectedCar.brand} {selectedCar.model}</h3>
          <div className="services-quick-list">
            {services.length === 0 ? (
              <p className="no-services">Няма добавени услуги. <button onClick={() => setActiveTab('services')}>Добави сега →</button></p>
            ) : (
              services.map(service => {
                const status = getServiceStatus(service.expiryDate);
                return (
                  <div key={service.id} className={`service-quick-item ${status.class}`}>
                    <span className="service-icon">{getServiceIcon(service.serviceType)}</span>
                    <span className="service-name">{getServiceName(service.serviceType)}</span>
                    <span className={`service-status ${status.class}`}>{status.text}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {cars.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>Нямаш добавени автомобили</h3>
          <p>Добави първия си автомобил, за да започнеш да следиш сроковете</p>
          <button className="primary-btn" onClick={() => { setActiveTab('cars'); setShowCarForm(true); }}>
            + Добави автомобил
          </button>
        </div>
      )}
    </div>
  );

  const renderCars = () => (
    <div className="tab-content cars-content">
      <div className="content-header">
        <h2>🚘 Моите автомобили</h2>
        <button className="primary-btn" onClick={() => { setShowCarForm(!showCarForm); setEditingCar(null); }}>
          {showCarForm ? '✕ Затвори' : '+ Добави автомобил'}
        </button>
      </div>

      {showCarForm && (
        <div className="form-container slide-in">
          <h3 className="form-title">{editingCar ? '✏️ Редактирай автомобил' : '➕ Нов автомобил'}</h3>
          <CarForm 
            onSubmit={handleAddCar} 
            onCancel={() => { setShowCarForm(false); setEditingCar(null); }}
            initialData={editingCar}
          />
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Зареждане...</p>
        </div>
      ) : cars.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>Нямаш добавени автомобили</h3>
          <p>Добави първия си автомобил</p>
        </div>
      ) : (
        <div className="cars-grid">
          {cars.map(car => {
            const logo = getBrandLogo(car.brand);
            return (
              <div 
                key={car.id} 
                className={`car-card ${selectedCar?.id === car.id ? 'selected' : ''}`}
                onClick={() => setSelectedCar(car)}
              >
                <div className="car-card-header">
                  {logo ? (
                    <img src={logo} alt={car.brand} className="brand-logo" />
                  ) : (
                    <span className="car-icon">🚗</span>
                  )}
                  <div className="car-actions">
                    <button 
                      className="edit-btn" 
                      onClick={(e) => { e.stopPropagation(); handleEditCar(car); }}
                      title="Редактирай"
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCar(car.id); }}
                      title="Изтрий"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <h3>{car.brand} {car.model}</h3>
                <div className="car-details">
                  <span className="car-year">📅 {car.year}</span>
                </div>
                {selectedCar?.id === car.id && (
                  <div className="selected-badge">✓ Избран</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderServices = () => (
    <div className="tab-content services-content">
      <div className="content-header">
        <h2>📋 Услуги</h2>
        <button className="primary-btn" onClick={() => setShowServiceForm(!showServiceForm)}>
          {showServiceForm ? '✕ Затвори' : '+ Добави услуга'}
        </button>
      </div>

      {cars.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>Първо добави автомобил</h3>
          <p>За да добавиш услуга, трябва да имаш поне един автомобил</p>
          <button className="primary-btn" onClick={() => setActiveTab('cars')}>
            Към колите →
          </button>
        </div>
      ) : (
        <>
          {showServiceForm && (
            <div className="form-container slide-in">
              <h3 className="form-title">➕ Нова услуга</h3>
              <ServiceForm 
                onSubmit={handleAddService} 
                onCancel={() => setShowServiceForm(false)}
                cars={cars}
                selectedCarId={selectedCar?.id}
                onCarChange={handleCarChangeForService}
              />
            </div>
          )}

          {/* Car selector dropdown */}
          <div className="car-selector">
            <label>Преглед на услуги за:</label>
            <select 
              value={selectedCar?.id || ''} 
              onChange={(e) => handleCarChangeForService(e.target.value)}
            >
              {cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model} ({car.year})
                </option>
              ))}
            </select>
          </div>

          {services.length === 0 ? (
            <div className="empty-state small">
              <div className="empty-icon">📋</div>
              <h3>Няма услуги</h3>
              <p>Добави първата услуга за този автомобил</p>
            </div>
          ) : (
            <div className="services-list">
              {services.map(service => {
                const status = getServiceStatus(service.expiryDate);
                return (
                  <div key={service.id} className={`service-card ${status.class}`}>
                    <div className="service-icon-large">{getServiceIcon(service.serviceType)}</div>
                    <div className="service-info">
                      <h4>{getServiceName(service.serviceType)}</h4>
                      <p>Изтича: {new Date(service.expiryDate).toLocaleDateString('bg-BG')}</p>
                    </div>
                    <div className={`service-status-badge ${status.class}`}>
                      {status.status === 'ok' && '✅ '}
                      {status.status === 'warning' && '⚠️ '}
                      {status.status === 'expired' && '❌ '}
                      {status.text}
                    </div>
                    <button 
                      className="delete-service-btn"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="tab-content settings-content">
      <div className="content-header">
        <h2>⚙️ Настройки</h2>
      </div>

      <div className="settings-section">
        <h3>👤 Профил</h3>
        <div className="setting-item">
          <label>Име:</label>
          <span>{user?.name}</span>
        </div>
        <div className="setting-item">
          <label>Email:</label>
          <span>{user?.email}</span>
        </div>
      </div>

      <div className="settings-section">
        <h3>🔔 Напомняния</h3>
        <div className="setting-item">
          <label>Email напомняния:</label>
          <span className="badge-active">Активни</span>
        </div>
        <div className="setting-item">
          <label>Дни преди изтичане:</label>
          <div className="reminder-days-control">
            <select 
              value={reminderDays} 
              onChange={(e) => handleReminderDaysChange(e.target.value)}
              className="reminder-select"
            >
              <option value="7">7 дни</option>
              <option value="14">14 дни</option>
              <option value="30">30 дни</option>
              <option value="45">45 дни</option>
              <option value="60">60 дни</option>
              <option value="90">90 дни</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-section danger-zone">
        <h3>⚠️ Опасна зона</h3>
        <button className="danger-btn" onClick={logout}>
          🚪 Изход от профила
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-new">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-icon">🚗</span>
          <span className="logo-text">CarGuard</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Табло</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'cars' ? 'active' : ''}`}
            onClick={() => setActiveTab('cars')}
          >
            <span className="nav-icon">🚘</span>
            <span className="nav-text">Коли</span>
            {cars.length > 0 && <span className="nav-badge">{cars.length}</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Услуги</span>
            {getExpiringServices().length > 0 && (
              <span className="nav-badge warning">{getExpiringServices().length}</span>
            )}
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Настройки</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button className="logout-btn-sidebar" onClick={logout}>
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'cars' && renderCars()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
};

export default Dashboard;
