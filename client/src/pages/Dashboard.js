import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { carsAPI, servicesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import CarForm from '../components/CarForm';
import ServiceForm from '../components/ServiceForm';
import { getBrandLogo } from '../data/brandLogos';
import { FaBarcode, FaCogs, FaExchangeAlt, FaRoad, FaHashtag } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [showCarForm, setShowCarForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reminderDays, setReminderDays] = useState(30);
  
  // States for Events Filter
  const [eventFilterType, setEventFilterType] = useState('all');
  const [eventFilterYear, setEventFilterYear] = useState(new Date().getFullYear().toString());
  
  // States for Chart Filters
  const [chartFilterCar, setChartFilterCar] = useState('all');
  const [chartFilterService, setChartFilterService] = useState('all');
  const [chartPeriod, setChartPeriod] = useState('6');
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout, updateReminderDays: updateReminderDaysContext } = useAuth();

  const handleReminderDaysChange = async (days) => {
    const value = parseInt(days);
    try {
      await updateReminderDaysContext(value);
      setReminderDays(value);
    } catch (err) {
      console.error('Error updating reminder days:', err);
      alert('Грешка при актуализиране на напомянията');
    }
  };

  useEffect(() => {
    // Initialize reminder days from user profile
    if (user?.reminderDays) {
      setReminderDays(user.reminderDays);
    } else {
      setReminderDays(30);
    }
    loadCars();
    loadAllServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.reminderDays]);

  useEffect(() => {
    if (selectedCar) {
      loadServices(selectedCar.id);
    }
  }, [selectedCar]);

  const loadAllServices = async () => {
    try {
      const response = await servicesAPI.getAllServices();
      setAllServices(response.data);
    } catch (err) {
      console.error('Error loading all services:', err);
    }
  };

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
        await carsAPI.updateCar(editingCar.id, carData);
        setEditingCar(null);
      } else {
        // Добавяне
        await carsAPI.addCar(carData);
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
        serviceData.expiryDate,
        serviceData.cost
      );
      loadServices(selectedCar.id);
      loadAllServices();
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
      'данък': '💰',
      'пожарогасител': '🔴',
      'ремонт': '🛠️',
      'обслужване': '🛢️',
      'гуми': '🛞',
      'зареждане': '⛽',
      'друго': '📝'
    };
    return icons[type] || '📋';
  };

  const getServiceName = (type) => {
    const names = {
      'гражданска': 'Гражданска отговорност',
      'винетка': 'Винетка',
      'преглед': 'Технически преглед',
      'каско': 'КАСКО',
      'данък': 'Данък МПС',
      'пожарогасител': 'Заверка на пожарогасител',
      'ремонт': 'Ремонт',
      'обслужване': 'Обслужване',
      'гуми': 'Добавяне на гуми',
      'зареждане': 'Зареждане',
      'друго': 'Друго'
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
    const expiringTypes = ['гражданска', 'винетка', 'преглед', 'каско', 'данък', 'пожарогасител'];
    return allServices.filter(s => {
      if (!expiringTypes.includes(s.serviceType)) return false;
      const status = getServiceStatus(s.expiryDate);
      return status.status === 'warning' || status.status === 'expired';
    });
  };

  // Calendar helpers
  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    // Add empty days for padding
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    return allServices.filter(s => {
      const expiry = new Date(s.expiryDate);
      return expiry.getDate() === day.getDate() && 
             expiry.getMonth() === day.getMonth() && 
             expiry.getFullYear() === day.getFullYear();
    });
  };

  const monthNames = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 
                      'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  // Chart data helper - monthly costs per car with filters
  const getChartData = () => {
    const months = [];
    const now = new Date();
    const periodMonths = parseInt(chartPeriod);
    
    // Filter cars based on selection
    const filteredCars = chartFilterCar === 'all' 
      ? cars 
      : cars.filter(c => c.id === parseInt(chartFilterCar));
    
    // Dynamic period
    for (let i = periodMonths - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[date.getMonth()].substring(0, 3);
      
      const monthData = { name: monthName, month: monthKey };
      
      // Calculate costs per car for this month
      filteredCars.forEach(car => {
        const carServices = allServices.filter(s => {
          const serviceDate = new Date(s.createdAt);
          const sMonth = `${serviceDate.getFullYear()}-${String(serviceDate.getMonth() + 1).padStart(2, '0')}`;
          const matchesCar = s.carId === car.id;
          const matchesMonth = sMonth === monthKey;
          const matchesService = chartFilterService === 'all' || s.serviceType === chartFilterService;
          return matchesCar && matchesMonth && matchesService;
        });
        
        const totalCost = carServices.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
        monthData[`${car.brand} ${car.model}`] = totalCost;
      });
      
      months.push(monthData);
    }
    
    return months;
  };

  // Generate distinct colors for each car
  const carColors = ['#dc3545', '#28a745', '#007bff', '#ffc107', '#6f42c1', '#17a2b8'];

  const getTotalCosts = () => {
    return allServices.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
  };

  const renderDashboard = () => (
    <div className="tab-content dashboard-view">
      {/* Top Stats Row */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-box-icon cars">🚗</div>
          <div className="stat-box-content">
            <span className="stat-box-value">{cars.length}</span>
            <span className="stat-box-label">Автомобили</span>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon services">📋</div>
          <div className="stat-box-content">
            <span className="stat-box-value">{allServices.length}</span>
            <span className="stat-box-label">Общо събития</span>
          </div>
        </div>
        <div className="stat-box warning">
          <div className="stat-box-icon">⚠️</div>
          <div className="stat-box-content">
            <span className="stat-box-value">{getExpiringServices().length}</span>
            <span className="stat-box-label">Изтичащи скоро</span>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon money">💰</div>
          <div className="stat-box-content">
            <span className="stat-box-value">{getTotalCosts().toFixed(0)} лв</span>
            <span className="stat-box-label">Общо разходи</span>
          </div>
        </div>
      </div>

      {cars.length === 0 ? (
        <div className="empty-state-dashboard">
          <div className="empty-icon">🚗</div>
          <h3>Добави първия си автомобил</h3>
          <p>Започни да следиш сроковете на застраховки и винетки</p>
          <button className="primary-btn" onClick={() => { setActiveTab('cars'); setShowCarForm(true); }}>
            + Добави автомобил
          </button>
        </div>
      ) : (
        <div className="dashboard-main-grid">
          {/* Calendar Section */}
          <div className="dashboard-section calendar-section">
            <div className="section-title">
              <h3>📅 Календар с предстоящи събития</h3>
              <div className="calendar-nav">
                <button onClick={() => navigateMonth(-1)}>‹</button>
                <span>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                <button onClick={() => navigateMonth(1)}>›</button>
              </div>
            </div>
            <div className="calendar-grid">
              <div className="calendar-header">
                <span>Нед</span>
                <span>Пон</span>
                <span>Вто</span>
                <span>Сря</span>
                <span>Чет</span>
                <span>Пет</span>
                <span>Съб</span>
              </div>
              <div className="calendar-days">
                {getMonthDays(currentMonth).map((day, idx) => {
                  const events = day ? getEventsForDay(day) : [];
                  const isToday = day && day.toDateString() === new Date().toDateString();
                  const expiringTypes = ['гражданска', 'винетка', 'преглед', 'каско', 'данък', 'пожарогасител'];
                  const hasExpired = events.some(e => expiringTypes.includes(e.serviceType) && getServiceStatus(e.expiryDate).status === 'expired');
                  const hasWarning = events.some(e => expiringTypes.includes(e.serviceType) && getServiceStatus(e.expiryDate).status === 'warning');
                  
                  return (
                    <div 
                      key={idx} 
                      className={`calendar-day ${!day ? 'empty' : ''} ${isToday ? 'today' : ''} ${hasExpired ? 'has-expired' : hasWarning ? 'has-warning' : events.length > 0 ? 'has-events' : ''}`}
                    >
                      {day && (
                        <>
                          <span className="day-number">{day.getDate()}</span>
                          {events.length > 0 && (
                            <div className="day-events">
                              {events.slice(0, 2).map((e, i) => {
                                const car = cars.find(c => c.id === e.carId);
                                const isExpirable = expiringTypes.includes(e.serviceType);
                                const statusClass = isExpirable ? getServiceStatus(e.expiryDate).class : 'status-ok';
                                return (
                                  <div key={i} className={`day-event ${statusClass}`}>
                                    {getServiceIcon(e.serviceType)} {car?.brand}
                                  </div>
                                );
                              })}
                              {events.length > 2 && (
                                <span className="more-events">+{events.length - 2}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="dashboard-section chart-section">
            <div className="section-title">
              <h3>📊 Месечни разходи</h3>
              <div className="chart-filters">
                <select 
                  value={chartFilterCar} 
                  onChange={(e) => setChartFilterCar(e.target.value)}
                  className="chart-filter-select"
                >
                  <option value="all">🚗 Всички автомобили</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model}
                    </option>
                  ))}
                </select>
                <select 
                  value={chartFilterService} 
                  onChange={(e) => setChartFilterService(e.target.value)}
                  className="chart-filter-select"
                >
                  <option value="all">📋 Всички разходи</option>
                  <option value="гражданска">🛡️ Гражданска</option>
                  <option value="винетка">🎫 Винетка</option>
                  <option value="преглед">🔧 Технически преглед</option>
                  <option value="каско">🔒 КАСКО</option>
                  <option value="данък">💰 Данък МПС</option>
                  <option value="пожарогасител">🧯 Пожарогасител</option>
                  <option value="ремонт">🔨 Ремонт</option>
                  <option value="обслужване">⚙️ Обслужване</option>
                  <option value="гуми">🚗 Гуми</option>
                  <option value="зареждане">⛽ Зареждане</option>
                  <option value="друго">📝 Друго</option>
                </select>
                <select 
                  value={chartPeriod} 
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="chart-filter-select"
                >
                  <option value="3">📅 3 месеца</option>
                  <option value="6">📅 6 месеца</option>
                  <option value="12">📅 12 месеца</option>
                </select>
              </div>
            </div>
            <div className="chart-container">
              {allServices.length > 0 && allServices.some(s => parseFloat(s.cost) > 0) ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value} лв`} />
                    <Tooltip 
                      formatter={(value, name) => [`${value} лв`, name]}
                      contentStyle={{ background: 'white', border: '1px solid #eee', borderRadius: '8px' }}
                    />
                    <Legend />
                    {(chartFilterCar === 'all' ? cars : cars.filter(c => c.id === parseInt(chartFilterCar))).map((car, idx) => (
                      <Line 
                        key={car.id}
                        type="monotone" 
                        dataKey={`${car.brand} ${car.model}`} 
                        stroke={carColors[idx % carColors.length]}
                        strokeWidth={2}
                        dot={{ fill: carColors[idx % carColors.length] }}
                      />
                    ))}
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-chart-data">
                  <span>📊</span>
                  <p>Няма данни за разходи</p>
                  <small>Добави събития с цена за да видиш графиката</small>
                </div>
              )}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="dashboard-section notifications-section">
            <div className="section-title">
              <h3>🔔 Напомняния</h3>
            </div>
            <div className="notifications-list">
              {(() => {
                const notifications = [];
                const today = new Date();
                
                // Generate notifications based on service status
                getExpiringServices().forEach(service => {
                  const car = cars.find(c => c.id === service.carId);
                  const status = getServiceStatus(service.expiryDate);
                  const expiryDate = new Date(service.expiryDate);
                  const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                  
                  if (status.status === 'expired') {
                    notifications.push({
                      id: `exp-${service.id}`,
                      type: 'danger',
                      icon: '🚨',
                      title: `${getServiceName(service.serviceType)} е изтекла!`,
                      message: `${car?.brand} ${car?.model} - изтекла на ${expiryDate.toLocaleDateString('bg-BG')}`,
                      time: 'Спешно'
                    });
                  } else if (daysLeft <= 7) {
                    notifications.push({
                      id: `warn-${service.id}`,
                      type: 'warning',
                      icon: '⚠️',
                      title: `${getServiceName(service.serviceType)} изтича скоро`,
                      message: `${car?.brand} ${car?.model} - остават ${daysLeft} дни`,
                      time: `${daysLeft} дни`
                    });
                  } else if (daysLeft <= 30) {
                    notifications.push({
                      id: `info-${service.id}`,
                      type: 'info',
                      icon: '📋',
                      title: `Напомняне за ${getServiceName(service.serviceType)}`,
                      message: `${car?.brand} ${car?.model} - изтича на ${expiryDate.toLocaleDateString('bg-BG')}`,
                      time: `${daysLeft} дни`
                    });
                  }
                });

                if (notifications.length === 0) {
                  return (
                    <div className="no-notifications">
                      <span>🔔</span>
                      <p>Няма нови известия</p>
                      <small>Всичко е наред с вашите автомобили</small>
                    </div>
                  );
                }

                return notifications.slice(0, 5).map(notif => (
                  <div key={notif.id} className={`notification-item ${notif.type}`}>
                    <div className="notification-icon">{notif.icon}</div>
                    <div className="notification-content">
                      <span className="notification-title">{notif.title}</span>
                      <span className="notification-message">{notif.message}</span>
                    </div>
                    <div className="notification-time">{notif.time}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCars = () => (
    <div className="tab-content cars-content-new">
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Зареждане...</p>
        </div>
      ) : (
        <div className="cars-layout">
          {showCarForm && (
            <div className="modal-overlay">
              <div className="modal-content-wrapper">
                <div className="modal-header">
                  <h3>{editingCar ? 'Редактиране на автомобил' : 'Добавяне на нов автомобил'}</h3>
                  <button className="modal-close-btn" onClick={() => { setShowCarForm(false); setEditingCar(null); }}>✕</button>
                </div>
                <CarForm 
                  onSubmit={handleAddCar} 
                  onCancel={() => { setShowCarForm(false); setEditingCar(null); }}
                  initialData={editingCar}
                />
              </div>
            </div>
          )}

          {/* Left Panel - Car List */}
          <div className="cars-list-panel">
            <div className="panel-header">
              <h3>🚘 Автомобили ({cars.length})</h3>
              <button 
                className="add-car-btn" 
                onClick={() => { setShowCarForm(true); setEditingCar(null); }}
              >
                + Добави
              </button>
            </div>
            
            <div className="cars-list-scroll">
              {cars.length === 0 ? (
                <div className="empty-cars">
                  <span>🚗</span>
                  <p>Нямаш автомобили</p>
                  <button onClick={() => setShowCarForm(true)}>Добави първия</button>
                </div>
              ) : (
                cars.map(car => {
                  const logo = getBrandLogo(car.brand);
                  const isSelected = selectedCar?.id === car.id;
                  const carServices = services.filter(s => s.carId === car.id);
                  const expiringCount = carServices.filter(s => {
                    const status = getServiceStatus(s.expiryDate);
                    return status.status === 'warning' || status.status === 'expired';
                  }).length;
                  
                  return (
                    <div 
                      key={car.id} 
                      className={`car-list-item ${isSelected ? 'selected' : ''} ${expiringCount > 0 ? 'has-warning' : ''}`}
                      onClick={() => setSelectedCar(car)}
                    >
                      <div className="car-list-logo">
                        {logo ? <img src={logo} alt={car.brand} /> : <span>🚗</span>}
                      </div>
                      <div className="car-list-info">
                        <span className="car-list-name">{car.brand} {car.model}</span>
                        <span className="car-list-year">{car.year} • {car.licensePlate || 'Без номер'}</span>
                      </div>
                      {expiringCount > 0 && (
                        <span className="car-warning-badge">{expiringCount}</span>
                      )}
                      {isSelected && <span className="car-selected-mark">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Selected Car Details */}
          <div className="car-detail-panel">
            {selectedCar ? (
              <>
                <div className="car-detail-header">
                  <div className="car-header-main">
                    <div className="car-detail-logo">
                      {getBrandLogo(selectedCar.brand) ? (
                        <img src={getBrandLogo(selectedCar.brand)} alt={selectedCar.brand} />
                      ) : (
                        <span>🚗</span>
                      )}
                    </div>
                    <div className="car-detail-title">
                      <h2>{selectedCar.brand} {selectedCar.model}</h2>
                      <p>{selectedCar.year} г. {selectedCar.licensePlate && `• ${selectedCar.licensePlate}`}</p>
                    </div>
                  </div>
                  <div className="car-detail-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEditCar(selectedCar)}
                    >
                      ✏️ Редактирай
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteCar(selectedCar.id)}
                    >
                      🗑️ Изтрий
                    </button>
                  </div>
                </div>

                <div className="car-detail-specs">
                  <div className="spec-card">
                    <div className="spec-icon"><FaHashtag /></div>
                    <div>
                      <h4>Рег. номер</h4>
                      <p>{selectedCar.licensePlate || '—'}</p>
                    </div>
                  </div>
                  
                  <div className="spec-card">
                    <div className="spec-icon"><FaBarcode /></div>
                    <div>
                      <h4>VIN (Рама)</h4>
                      <p>{selectedCar.vin || '—'}</p>
                    </div>
                  </div>

                  <div className="spec-card">
                    <div className="spec-icon"><FaCogs /></div>
                    <div>
                      <h4>Двигател</h4>
                      <p>
                        {[
                          selectedCar.engineType === 'Benzin' ? 'Бензин' :
                          selectedCar.engineType === 'Diesel' ? 'Дизел' :
                          selectedCar.engineType === 'Electric' ? 'Електрически' :
                          selectedCar.engineType === 'Hybrid' ? 'Хибрид' :
                          selectedCar.engineType,
                          selectedCar.horsepower ? `${selectedCar.horsepower} к.с.` : null
                        ].filter(Boolean).join(', ') || '—'}
                      </p>
                      {selectedCar.euroStandard && <span>{selectedCar.euroStandard}</span>}
                    </div>
                  </div>

                  <div className="spec-card">
                    <div className="spec-icon"><FaExchangeAlt /></div>
                    <div>
                      <h4>Скоростна кутия</h4>
                      <p>
                        {selectedCar.transmission === 'Manual' ? 'Ръчна' : 
                         selectedCar.transmission === 'Automatic' ? 'Автоматична' : 
                         selectedCar.transmission || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="spec-card">
                    <div className="spec-icon"><FaRoad /></div>
                    <div>
                      <h4>Пробег</h4>
                      <p>{selectedCar.mileage ? `${selectedCar.mileage.toLocaleString()} км` : '—'}</p>
                    </div>
                  </div>
                </div>

                {(selectedCar.tireWidth || selectedCar.tireDiameter || selectedCar.tireBrand) && (
                   <div className="car-tires-section">
                     <h4>Гуми и джанти</h4>
                     <div className={`tire-summary-card ${selectedCar.tireSeason ? selectedCar.tireSeason.toLowerCase() : ''}`}>
                        <div className="tire-season-visual">
                          {selectedCar.tireSeason === 'Summer' && <span className="season-emoji">☀️</span>}
                          {selectedCar.tireSeason === 'Winter' && <span className="season-emoji">❄️</span>}
                          {selectedCar.tireSeason === 'AllSeasons' && <span className="season-emoji">⛅</span>}
                          {!selectedCar.tireSeason && <span className="season-emoji">🔘</span>}
                        </div>
                        
                        <div className="tire-details-content">
                           <span className="tire-size-display">
                             {selectedCar.tireWidth || '?'}/{selectedCar.tireHeight || '?'} R{selectedCar.tireDiameter || '?'}
                           </span>
                           
                           <div className="tire-meta-row">
                             <span className="tire-brand-display">
                               {selectedCar.tireBrand || 'Неизвестна марка'}
                             </span>
                             {selectedCar.tireDot && (
                               <span className="tire-dot-badge">DOT {selectedCar.tireDot}</span>
                             )}
                           </div>
                           
                           <span className="tire-season-name">
                              {selectedCar.tireSeason === 'Summer' ? 'Летни гуми' : 
                               selectedCar.tireSeason === 'Winter' ? 'Зимни гуми' : 
                               selectedCar.tireSeason === 'AllSeasons' ? 'Всесезонни гуми' : 'Неопределен сезон'}
                           </span>
                        </div>
                     </div>
                   </div>
                )}

                <div className="car-services-section">
                  <div className="section-header">
                    <h3>📋 Събития ({services.length})</h3>
                    <button 
                      className="add-service-btn"
                      onClick={() => setShowServiceForm(true)}
                    >
                      + Добави събитие
                    </button>
                  </div>

                  {showServiceForm && (
                    <div className="service-form-inline">
                      <ServiceForm 
                        onSubmit={handleAddService} 
                        onCancel={() => setShowServiceForm(false)}
                        cars={cars}
                        selectedCarId={selectedCar?.id}
                        onCarChange={handleCarChangeForService}
                      />
                    </div>
                  )}

                  {services.length === 0 ? (
                    <div className="empty-services-detail">
                      <span>📭</span>
                      <p>Няма добавени събития за този автомобил</p>
                      <small>Добави застраховка, ремонт или друго събитие</small>
                    </div>
                  ) : (
                    <div className="services-grid-detail">
                      {services.map(service => {
                        const expiringTypes = ['гражданска', 'винетка', 'преглед', 'каско', 'данък', 'пожарогасител'];
                        const isExpirable = expiringTypes.includes(service.serviceType);
                        const status = isExpirable ? getServiceStatus(service.expiryDate) : { class: 'status-neutral', text: '' };
                        
                        return (
                          <div key={service.id} className={`service-detail-card ${status.class}`}>
                            <div className="service-detail-icon">{getServiceIcon(service.serviceType)}</div>
                            <div className="service-detail-info">
                              <h4>{getServiceName(service.serviceType)}</h4>
                              <p>
                                {isExpirable ? 'Изтича: ' : 'Дата: '}
                                {new Date(service.expiryDate).toLocaleDateString('bg-BG')}
                              </p>
                              {service.liters && <span className="service-sub-info">⛽ {service.liters}L</span>}
                              {service.cost > 0 && <span className="service-cost-badge">{service.cost.toFixed(2)} лв.</span>}
                            </div>
                            {isExpirable ? (
                              <div className={`service-detail-status ${status.class}`}>
                                {status.status === 'expired' ? '❌' : status.status === 'warning' ? '⚠️' : '✅'} {status.text}
                              </div>
                            ) : (
                               <div className="service-detail-status"></div>
                            )}
                            <button 
                              className="service-delete-btn"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-car-selected">
                <span>👈</span>
                <h3>Избери автомобил</h3>
                <p>Кликни върху автомобил от списъка, за да видиш детайли</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderServices = () => {
    // 1. Filter Logic
    const filteredServices = services.filter(s => {
      const date = new Date(s.expiryDate);
      const matchesYear = eventFilterYear === 'all' || date.getFullYear().toString() === eventFilterYear;
      const matchesType = eventFilterType === 'all' || s.serviceType === eventFilterType;
      return matchesYear && matchesType;
    });

    // 2. Chart Data Preparation
    const getExpensesChartData = () => {
      const expenses = {};
      const months = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
      
      // Initialize months
      months.forEach(m => expenses[m] = 0);

      filteredServices.forEach(s => {
         const date = new Date(s.expiryDate);
         const monthName = months[date.getMonth()];
         if (s.cost) {
            expenses[monthName] += parseFloat(s.cost);
         }
      });

      return months.map(m => ({ name: m, cost: expenses[m] }));
    };

    return (
    <div className="tab-content services-content">
      <div className="content-header">
        <h2>📋 Събития</h2>
        <button className="primary-btn" onClick={() => setShowServiceForm(!showServiceForm)}>
          {showServiceForm ? '✕ Затвори' : '+ Добави събитие'}
        </button>
      </div>

      {cars.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>Първо добави автомобил</h3>
          <p>За да добавиш събитие, трябва да имаш поне един автомобил</p>
          <button className="primary-btn" onClick={() => setActiveTab('cars')}>
            Към колите →
          </button>
        </div>
      ) : (
        <>
          {showServiceForm && (
            <div className="form-container slide-in">
              <h3 className="form-title">➕ Ново събитие</h3>
              <ServiceForm 
                onSubmit={handleAddService} 
                onCancel={() => setShowServiceForm(false)}
                cars={cars}
                selectedCarId={selectedCar?.id}
                onCarChange={handleCarChangeForService}
              />
            </div>
          )}

          {/* Controls Row */}
          <div className="services-controls-row">
                <div className="control-group">
                  <label>Автомобил:</label>
                  <select 
                    value={selectedCar?.id || ''} 
                    onChange={(e) => handleCarChangeForService(e.target.value)}
                    className="control-select"
                  >
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="control-group">
                  <label>Година:</label>
                  <select 
                    value={eventFilterYear} 
                    onChange={(e) => setEventFilterYear(e.target.value)}
                    className="control-select"
                  >
                    <option value="all">Всички</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div className="control-group">
                  <label>Категория:</label>
                  <select 
                    value={eventFilterType} 
                    onChange={(e) => setEventFilterType(e.target.value)}
                    className="control-select"
                  >
                    <option value="all">Всички</option>
                    <option value="преглед">🔧 Технически преглед</option>
                    <option value="гражданска">🛡️ Гражданска застраховка</option>
                    <option value="каско">💎 КАСКО</option>
                    <option value="винетка">🛣️ Винетка</option>
                    <option value="данък">💰 Данък</option>
                    <option value="пожарогасител">🔴 Заверка на пожарогасител</option>
                    <option value="ремонт">🛠️ Ремонт</option>
                    <option value="обслужване">🛢️ Обслужване</option>
                    <option value="гуми">🛞 Добавяне на гуми</option>
                    <option value="зареждане">⛽ Зареждане</option>
                    <option value="друго">📝 Друго</option>
                  </select>
                </div>
          </div>

          {/* Stats Summary */}
          <div className="events-stats-summary">
                <div className="event-stat-card">
                  <span className="ev-stat-label">Общо разходи</span>
                  <span className="ev-stat-value">
                      {filteredServices.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0).toFixed(2)} лв.
                  </span>
                </div>
                <div className="event-stat-card">
                  <span className="ev-stat-label">Брой събития</span>
                  <span className="ev-stat-value">{filteredServices.length}</span>
                </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="empty-state small">
              <div className="empty-icon">📅</div>
              <h3>Няма намерени събития</h3>
              <p>Няма записи за избраните филтри</p>
            </div>
          ) : (
            <div className="services-list-new">
              {filteredServices.map(service => {
                return (
                  <div key={service.id} className="service-card-detailed">
                    <div className="service-card-left">
                        <div className="service-icon-circle">{getServiceIcon(service.serviceType)}</div>
                        <div className="service-main-info">
                          <h4>{getServiceName(service.serviceType)}</h4>
                          <span className="service-date">{new Date(service.expiryDate).toLocaleDateString('bg-BG')}</span>
                        </div>
                    </div>
                    
                    <div className="service-card-center">
                        {service.serviceType === 'зареждане' && service.liters && (
                            <div className="fuel-info">
                              <span>⛽ {service.liters} L</span>
                              {service.pricePerLiter && <span> • {service.pricePerLiter} лв./л</span>}
                              {service.fuelType && <span> ({service.fuelType})</span>}
                            </div>
                        )}
                        {service.notes && (
                            <div className="service-notes">
                              "{service.notes}"
                            </div>
                        )}
                    </div>

                    <div className="service-card-right">
                        <span className="service-cost-large">
                          {service.cost > 0 ? `${parseFloat(service.cost).toFixed(2)} лв.` : '-'}
                        </span>
                        <button 
                          className="delete-mini-btn"
                          onClick={() => handleDeleteService(service.id)}
                          title="Изтрий"
                        >
                          ×
                        </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chart Section */}
          {filteredServices.length > 0 && (
              <div className="chart-section-filtered">
                  <h3>📊 Графика на разходите</h3>
                  <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={getExpensesChartData()}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                              <XAxis dataKey="name" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#999" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                              <Tooltip 
                                  formatter={(value) => [`${value} лв`, 'Разход']}
                                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              />
                              <Line 
                                  type="monotone" 
                                  dataKey="cost" 
                                  stroke="#007bff" 
                                  strokeWidth={3} 
                                  dot={{ fill: '#007bff', r: 4 }} 
                                  activeDot={{ r: 6 }} 
                              />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          )}
        </>
      )}
    </div>
  );
  };

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

      <div className="settings-section">
        <button className="danger-btn" onClick={() => { logout(); navigate('/'); }}>
          🚪 Изход от профила
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-new">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-left">
          <span className="logo-icon">🚗</span>
          <span className="logo-text">CarGuard</span>
        </div>
        <button 
          className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`mobile-dropdown-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button 
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Табло</span>
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'cars' ? 'active' : ''}`}
          onClick={() => { setActiveTab('cars'); setMobileMenuOpen(false); }}
        >
          <span className="nav-icon">🚘</span>
          <span className="nav-text">Автопарк</span>
          {cars.length > 0 && <span className="nav-badge">{cars.length}</span>}
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => { setActiveTab('services'); setMobileMenuOpen(false); }}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-text">Събития</span>
          {getExpiringServices().length > 0 && (
            <span className="nav-badge warning">{getExpiringServices().length}</span>
          )}
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Настройки</span>
        </button>
        <div className="mobile-user-info">
          <span>👤 {user?.name}</span>
          <button className="mobile-logout-btn" onClick={logout}>
            🚪 Изход
          </button>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}

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
            <span className="nav-text">Автопарк</span>
            {cars.length > 0 && <span className="nav-badge">{cars.length}</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Събития</span>
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
