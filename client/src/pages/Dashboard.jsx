import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import carsService from '../lib/supabaseCars';
import servicesService from '../lib/supabaseServices';
import { generateCarReport } from '../lib/pdfService';
import CarForm from '../components/CarForm';
import ServiceForm from '../components/ServiceForm';
import { getBrandLogo } from '../data/brandLogos';
import { FaBarcode, FaHashtag } from 'react-icons/fa';
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
  const [reminderDays, setReminderDays] = useState(30);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [carPickerMode, setCarPickerMode] = useState(null); // 'service' | 'pdf'
  const [carPickerSelected, setCarPickerSelected] = useState(null);

  const { user, logout, updateReminderDays: updateReminderDaysContext, updateReminderEnabled: updateReminderEnabledContext, isInitialized } = useAuth();
  const logoUrl = '/logo.png';

  // COPY ALL HANDLER FUNCTIONS FROM ORIGINAL Dashboard.js
  // (All the functions from original are preserved here)
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleReminderDaysChange = async (days) => {
    const value = parseInt(days);
    try {
      await updateReminderDaysContext(value);
      setReminderDays(value);
    } catch (err) {
      console.error('Error updating reminder days:', err);
      alert('Error updating reminders');
    }
  };

  const handleReminderEnabledChange = async (enabled) => {
    try {
      await updateReminderEnabledContext(enabled);
      setReminderEnabled(enabled);
    } catch (err) {
      console.error('Error updating reminder enabled:', err);
      alert('Error updating reminders');
    }
  };

  useEffect(() => {
    if (!isInitialized) return;
    
    if (user?.reminderDays) {
      setReminderDays(user.reminderDays);
    } else {
      setReminderDays(30);
    }

    if (typeof user?.reminderEnabled === 'boolean') {
      setReminderEnabled(user.reminderEnabled);
    } else {
      setReminderEnabled(true);
    }
    loadCars();
    loadAllServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, user?.reminderDays, user?.reminderEnabled]);

  useEffect(() => {
    if (selectedCar) {
      loadServices(selectedCar.id);
    }
  }, [selectedCar]);

  const loadAllServices = async () => {
    try {
      if (!user?.id) return;
      const userCars = await carsService.getAllCars(user.id);
      const allUserServices = [];
      for (const car of userCars) {
        const carServices = await servicesService.getServices(car.id);
        allUserServices.push(...carServices);
      }
      setAllServices(allUserServices);
    } catch (err) {
      console.error('Error loading all services:', err);
    }
  };

  const loadCars = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;
      const cars = await carsService.getAllCars(user.id);
      setCars(cars);
      if (cars.length > 0 && !selectedCar) {
        setSelectedCar(cars[0]);
      }
    } catch (err) {
      console.error('Error loading cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (carId) => {
    try {
      const services = await servicesService.getServices(carId);
      setServices(services);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const handleAddCar = async (carData) => {
    try {
      if (editingCar) {
        await carsService.updateCar(editingCar.id, carData);
        setEditingCar(null);
      } else {
        await carsService.createCar(user.id, carData);
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
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }
    try {
      await carsService.deleteCar(carId);
      loadCars();
      if (selectedCar?.id === carId) {
        setSelectedCar(null);
      }
    } catch (err) {
      console.error('Error deleting car:', err);
    }
  };

  const openCarDetail = (car) => {
    setSelectedCar(car);
  };

  const handleCarChangeForService = (carId) => {
    const car = cars.find(c => c.id === parseInt(carId));
    if (car) {
      setSelectedCar(car);
    }
  };

  const handleAddService = async (serviceData) => {
    try {
      let fileUrl = null;
      
      if (serviceData.file) {
        try {
          const tempService = await servicesService.createService({
            carId: selectedCar.id,
            userId: user.id,
            serviceType: serviceData.serviceType,
            expiryDate: serviceData.expiryDate,
            cost: serviceData.cost,
            liters: serviceData.liters,
            pricePerLiter: serviceData.pricePerLiter,
            fuelType: serviceData.fuelType,
            notes: serviceData.notes,
            mileage: serviceData.mileage
          });
          
          fileUrl = await servicesService.uploadFile(serviceData.file, user.id, tempService.id);
          await servicesService.updateService(tempService.id, { fileUrl });
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          alert('Error uploading file. Service saved without file.');
        }
      } else {
        await servicesService.createService({
          carId: selectedCar.id,
          userId: user.id,
          serviceType: serviceData.serviceType,
          expiryDate: serviceData.expiryDate,
          cost: serviceData.cost,
          liters: serviceData.liters,
          pricePerLiter: serviceData.pricePerLiter,
          fuelType: serviceData.fuelType,
          notes: serviceData.notes,
          mileage: serviceData.mileage
        });
      }
      
      loadServices(selectedCar.id);
      loadAllServices();
      setShowServiceForm(false);
    } catch (err) {
      console.error('Error adding service:', err);
      alert('Error adding service: ' + err.message);
    }
  };

  const openCarPicker = (mode) => {
    setCarPickerSelected(selectedCar || cars[0] || null);
    setCarPickerMode(mode);
    setShowCarPicker(true);
  };

  const handleCarPickerConfirm = async () => {
    if (!carPickerSelected) return;
    setShowCarPicker(false);
    if (carPickerMode === 'service') {
      setSelectedCar(carPickerSelected);
      setActiveTab('services');
      setShowServiceForm(true);
    } else if (carPickerMode === 'pdf') {
      try {
        await generateCarReport(carPickerSelected, allServices.filter(s => s.carId === carPickerSelected.id));
      } catch (err) {
        console.error('Error generating PDF:', err);
        alert('Error generating PDF: ' + err.message);
      }
    }
  };

  const handleDownloadPDF = async () => {
    openCarPicker('pdf');
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    try {
      await servicesService.deleteService(serviceId);
      loadServices(selectedCar.id);
      loadAllServices();
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  const getServiceIcon = (type) => {
    const icons = {
      'civil_liability': '🛡️',
      'vignette': '🛣️',
      'inspection': '🔧',
      'casco': '💎',
      'tax': '💰',
      'fire_extinguisher': '🔴',
      'repair': '🛠️',
      'maintenance': '🛢️',
      'tires': '🛞',
      'refuel': '⛽',
      'other': '📝'
    };
    return icons[type] || '📋';
  };

  const getServiceName = (type) => {
    const names = {
      'civil_liability': 'Civil Liability Insurance',
      'vignette': 'Vignette',
      'inspection': 'Technical Inspection',
      'casco': 'CASCO Insurance',
      'tax': 'Vehicle Tax',
      'fire_extinguisher': 'Fire Extinguisher Check',
      'repair': 'Repair',
      'maintenance': 'Maintenance',
      'tires': 'Tire Change',
      'refuel': 'Refuel',
      'other': 'Other'
    };
    return names[type] || type;
  };

  const getServiceStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', text: 'Expired!', class: 'status-expired' };
    if (daysLeft <= reminderDays) return { status: 'warning', text: `${daysLeft} days`, class: 'status-warning' };
    return { status: 'ok', text: `${daysLeft} days`, class: 'status-ok' };
  };

  const isExpiringType = (type) => {
    return ['civil_liability', 'vignette', 'inspection', 'casco', 'tax', 'fire_extinguisher'].includes(type);
  };

  // Calculate statistics
  const stats = {
    totalCars: cars.length,
    upcomingServices: services.filter(s => {
      if (!isExpiringType(s.serviceType)) return false;
      const status = getServiceStatus(s.expiryDate);
      return status.status === 'warning' || status.status === 'expired';
    }).length,
    totalServices: allServices.length,
    totalCosts: allServices.reduce((sum, s) => sum + (s.cost || 0), 0)
  };

  if (loading) {
    return (
      <div className="dashboard-staging">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-staging">
      {/* BOOTSTRAP HEADER with original styling */}
      <nav className="navbar navbar-dark sticky-top" style={{background: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', padding: '1rem 2rem'}}>
        <div className="container-fluid">
          <div className="navbar-brand d-flex align-items-center gap-2 mb-0">
            <img src={logoUrl} alt="CarGuard" className="logo-img" style={{width: '40px', height: '40px', objectFit: 'contain'}} />
            <span style={{fontSize: '24px', fontWeight: '700'}}>CarGuard</span>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50 d-none d-md-inline">{user?.email}</span>
            <button className="btn btn-danger rounded-pill px-4" onClick={handleLogout} style={{fontWeight: '700'}}>
              Изход
            </button>
          </div>
        </div>
      </nav>

      {/* Tab Navigation - Horizontal */}
      <div className="tab-navigation">
        <div className="container-fluid">
          <div className="nav-tabs-custom">
            <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <i className="bi bi-speedometer2"></i>
              <span>Преглед</span>
            </button>
            <button className={`tab-btn ${activeTab === 'cars' ? 'active' : ''}`} onClick={() => setActiveTab('cars')}>
              <i className="bi bi-car-front"></i>
              <span>Моите коли</span>
            </button>
            <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
              <i className="bi bi-wrench"></i>
              <span>Услуги</span>
            </button>
            <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
              <i className="bi bi-folder"></i>
              <span>Документи</span>
            </button>
            <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <i className="bi bi-gear"></i>
              <span>Настройки</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-container">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="tab-content-staging">
            {/* Welcome Header */}
            <div className="welcome-header">
              <h1><i className="bi bi-emoji-smile"></i> Добре дошъл обратно, {user?.name || user?.email?.split('@')[0]}!</h1>
              <p>Ето преглед на твоите автомобили и предстоящи услуги</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-car-front-fill"></i>
                </div>
                <div className="stat-value">{stats.totalCars.toLocaleString('en-US')}</div>
                <div className="stat-label">Автомобили</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                </div>
                <div className="stat-value">{stats.upcomingServices.toLocaleString('en-US')}</div>
                <div className="stat-label">Наближаващи срокове</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="stat-value">{stats.totalServices.toLocaleString('en-US')}</div>
                <div className="stat-label">Извършени услуги</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-cash-coin"></i>
                </div>
                <div className="stat-value">{Math.round(stats.totalCosts).toLocaleString('en-US')}</div>
                <div className="stat-label">Разходи (€)</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <div className="quick-action-btn" onClick={() => { setActiveTab('cars'); setShowCarForm(true); }}>
                <i className="bi bi-plus-circle-fill"></i>
                <h4>Добави автомобил</h4>
              </div>
              <div className="quick-action-btn" onClick={() => openCarPicker('service')}>
                <i className="bi bi-wrench"></i>
                <h4>Добави услуга</h4>
              </div>
              <div className="quick-action-btn" onClick={() => openCarPicker('pdf')}>
                <i className="bi bi-file-pdf"></i>
                <h4>Генерирай отчет</h4>
              </div>
              <div className="quick-action-btn" onClick={() => setActiveTab('settings')}>
                <i className="bi bi-gear"></i>
                <h4>Настройки</h4>
              </div>
            </div>

            {/* Notifications Section */}
            {services.length > 0 && (
              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title">
                    <i className="bi bi-bell-fill"></i>
                    Важни напомняния
                  </h2>
                </div>
                {services.filter(s => isExpiringType(s.serviceType)).slice(0, 5).map(service => {
                  const status = getServiceStatus(service.expiryDate);
                  const daysDiff = Math.ceil((new Date(service.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={service.id} className={`notification-item ${status.status === 'expired' ? 'urgent' : ''}`}>
                      <i className={`bi bi-${status.status === 'expired' ? 'exclamation-triangle-fill' : 'info-circle-fill'}`}></i>
                      <div className="notification-content">
                        <h5>{getServiceName(service.serviceType)} на {cars.find(c => c.id === service.carId)?.brand} {cars.find(c => c.id === service.carId)?.model} изтича след {daysDiff < 0 ? 0 : daysDiff} дни{status.status === 'expired' ? '!' : ''}</h5>
                        <p>Краен срок: {new Date(service.expiryDate).toLocaleDateString('bg-BG', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* My Cars Preview */}
            {cars.length > 0 && (
              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title">
                    <i className="bi bi-car-front"></i>
                    Моите автомобили
                  </h2>
                  <button className="btn-outline-custom" onClick={() => setActiveTab('cars')}>
                    Виж всички <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
                <div className="cars-grid">
                    {cars.slice(0, 3).map((car, index) => (
                      <div key={car.id} className="car-card">
                        {getBrandLogo(car.brand) ? (
                          <img src={getBrandLogo(car.brand)} alt={car.brand} className="car-icon" style={{width:'48px', height:'48px', objectFit:'contain'}} />
                        ) : (
                          <i className="car-icon bi bi-car-front-fill"></i>
                        )}
                        <h3>{car.brand} {car.model}</h3>
                        <div className="car-info-item">
                          <i className="bi bi-calendar-check"></i>
                          <span>Година: {car.year}</span>
                        </div>
                        <div className="car-info-item">
                          <i className="bi bi-hash"></i>
                          <span>Рег. номер: {car.licensePlate}</span>
                        </div>
                        {car.mileage && (
                          <div className="car-info-item">
                            <i className="bi bi-speedometer"></i>
                            <span>{car.mileage.toLocaleString()} км</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CARS TAB */}
        {activeTab === 'cars' && (
          <div className="tab-content-staging">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h3 mb-0">🚗 Моите коли</h2>
              <button className="btn btn-danger" onClick={() => setShowCarForm(true)}>
                ➕ Добави кола
              </button>
            </div>

            {cars.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">Няма добавени автомобили. Кликнете "Добави кола" за да започнете!</p>
              </div>
            ) : (
              <>
              <div className="row g-4">
                {cars.map(car => (
                  <div key={car.id} className="col-md-4">
                    <div className={`card car-card ${selectedCar?.id === car.id ? 'border-danger' : ''}`} onClick={() => openCarDetail(car)} style={{cursor:'pointer', borderWidth: selectedCar?.id === car.id ? '2px' : '1px'}}>
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-3">
                            {getBrandLogo(car.brand) && (
                              <img src={getBrandLogo(car.brand)} alt={car.brand} style={{width: '50px', height: '50px', objectFit: 'contain'}} />
                            )}
                            <div>
                              <h5 className="mb-0">{car.brand} {car.model}</h5>
                              <p className="mb-0 small text-muted">Година: {car.year}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <FaHashtag className="me-2" />
                          <strong>Номер:</strong> {car.licensePlate}
                        </div>
                        {car.vin && (
                          <div className="mb-2">
                            <FaBarcode className="me-2" />
                            <strong>ВИН:</strong> {car.vin}
                          </div>
                        )}
                        <div className="d-flex gap-2 mt-3">
                          <button className="btn btn-sm btn-outline-primary" onClick={(e) => { e.stopPropagation(); handleEditCar(car); }}>
                            Редактирай
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteCar(car.id); }}>
                            Изтрий
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Car Detail Panel - Cars Tab */}
              {selectedCar && (
                <div style={{marginTop:'2rem', background:'#fff', borderRadius:'16px', border:'1px solid #e9ecef', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', overflow:'hidden'}}>
                  <div style={{background:'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem'}}>
                    {getBrandLogo(selectedCar.brand) && (
                      <img src={getBrandLogo(selectedCar.brand)} alt={selectedCar.brand} style={{width:'48px', height:'48px', objectFit:'contain', background:'#fff', borderRadius:'8px', padding:'4px'}} />
                    )}
                    <div style={{color:'#fff'}}>
                      <div style={{fontWeight:700, fontSize:'1.2rem'}}>{selectedCar.brand} {selectedCar.model}</div>
                      <div style={{opacity:0.85, fontSize:'0.88rem'}}>{selectedCar.year} г. &middot; {selectedCar.licensePlate}</div>
                    </div>
                  </div>
                  <div style={{padding:'1.5rem'}}>
                    <h6 style={{fontWeight:700, color:'#dc3545', marginBottom:'1rem'}}><i className="bi bi-info-circle me-2"></i>Основна информация</h6>
                    <div className="row g-3 mb-4">
                      {[
                        { icon: 'bi-calendar2', label: 'Година', value: selectedCar.year },
                        { icon: 'bi-hash', label: 'Рег. номер', value: selectedCar.licensePlate },
                        { icon: 'bi-upc-scan', label: 'ВИН', value: selectedCar.vin },
                        { icon: 'bi-lightning-charge', label: 'Тип двигател', value: selectedCar.engineType },
                        { icon: 'bi-speedometer2', label: 'Конски сили', value: selectedCar.horsepower ? `${selectedCar.horsepower} к.с.` : null },
                        { icon: 'bi-fuel-pump', label: 'Гориво', value: selectedCar.fuelType },
                        { icon: 'bi-speedometer', label: 'Пробег', value: selectedCar.mileage ? `${Number(selectedCar.mileage).toLocaleString()} км` : null },
                        { icon: 'bi-palette', label: 'Цвят', value: selectedCar.color },
                      ].filter(f => f.value).map((field, i) => (
                        <div key={i} className="col-6 col-md-3">
                          <div style={{background:'#f8f9fa', borderRadius:'10px', padding:'0.75rem 1rem'}}>
                            <div style={{fontSize:'0.72rem', color:'#6c757d', marginBottom:'2px'}}><i className={`bi ${field.icon} me-1`}></i>{field.label}</div>
                            <div style={{fontWeight:600, color:'#1a1a1a'}}>{field.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(selectedCar.tireWidth || selectedCar.tireBrand || selectedCar.tireSeason) && (
                      <>
                        <h6 style={{fontWeight:700, color:'#dc3545', marginBottom:'1rem'}}><i className="bi bi-circle me-2"></i>Гуми</h6>
                        <div className="row g-3 mb-4">
                          {[
                            { icon: 'bi-arrows-expand', label: 'Размер', value: [selectedCar.tireWidth, selectedCar.tireHeight, selectedCar.tireDiameter].filter(Boolean).join('/') || null },
                            { icon: 'bi-tag', label: 'Марка гуми', value: selectedCar.tireBrand },
                            { icon: 'bi-thermometer-half', label: 'Сезон', value: selectedCar.tireSeason },
                            { icon: 'bi-calendar3', label: 'DOT', value: selectedCar.tireDot },
                          ].filter(f => f.value).map((field, i) => (
                            <div key={i} className="col-6 col-md-3">
                              <div style={{background:'#f8f9fa', borderRadius:'10px', padding:'0.75rem 1rem'}}>
                                <div style={{fontSize:'0.72rem', color:'#6c757d', marginBottom:'2px'}}><i className={`bi ${field.icon} me-1`}></i>{field.label}</div>
                                <div style={{fontWeight:600, color:'#1a1a1a'}}>{field.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <h6 style={{fontWeight:700, color:'#dc3545', marginBottom:'1rem'}}><i className="bi bi-wrench me-2"></i>Услуги</h6>
                    {services.length === 0 ? (
                      <div style={{color:'#6c757d', padding:'1rem 0'}}>Няма добавени услуги</div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {services.map(service => {
                          const status = isExpiringType(service.serviceType) ? getServiceStatus(service.expiryDate) : null;
                          const statusColor = status?.status === 'expired' ? '#dc3545' : status?.status === 'warning' ? '#fd7e14' : '#198754';
                          return (
                            <div key={service.id} style={{background:'#f8f9fa', borderRadius:'10px', padding:'0.75rem 1rem', borderLeft:`4px solid ${status ? statusColor : '#dee2e6'}`}}>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div style={{fontWeight:600}}>{getServiceIcon(service.serviceType)} {getServiceName(service.serviceType)}</div>
                                  <div style={{fontSize:'0.82rem', color:'#6c757d'}}>
                                    {service.expiryDate && <span>{isExpiringType(service.serviceType) ? 'Изтича:' : 'Дата:'} {new Date(service.expiryDate).toLocaleDateString('bg-BG')}</span>}
                                    {service.cost > 0 && <span className="ms-3">💰 {service.cost} €</span>}
                                    {service.mileage > 0 && <span className="ms-3">🛣️ {Number(service.mileage).toLocaleString()} км</span>}
                                  </div>
                                  {service.notes && <div style={{fontSize:'0.8rem', color:'#495057', marginTop:'2px'}}>{service.notes}</div>}
                                </div>
                                {status && <span style={{fontSize:'0.75rem', fontWeight:600, color:statusColor, whiteSpace:'nowrap'}}>{status.text}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="tab-content-staging">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h3 mb-0">🔧 Услуги</h2>
              <button className="btn btn-danger" onClick={() => setShowServiceForm(true)} disabled={!selectedCar}>
                ➕ Добави услуга
              </button>
            </div>

            {!selectedCar ? (
              <div className="alert alert-info">Моля, изберете автомобил първо</div>
            ) : (
              <>
                <div className="d-flex align-items-center gap-3 mb-4 p-3" style={{background:'#f8f9fa', borderRadius:'12px', border:'1px solid #e9ecef'}}>
                  {getBrandLogo(selectedCar.brand) && (
                    <img src={getBrandLogo(selectedCar.brand)} alt={selectedCar.brand} style={{width:'40px', height:'40px', objectFit:'contain'}} />
                  )}
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700}}>{selectedCar.brand} {selectedCar.model}</div>
                    <div style={{fontSize:'0.85rem', color:'#6c757d'}}>{selectedCar.licensePlate}</div>
                  </div>
                  <select className="form-select" style={{width:'auto'}} value={selectedCar?.id || ''} onChange={(e) => handleCarChangeForService(e.target.value)}>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>{car.brand} {car.model} - {car.licensePlate}</option>
                    ))}
                  </select>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Услуги за {selectedCar.brand} {selectedCar.model}</h5>
                  </div>
                  <div className="card-body">
                    {services.length === 0 ? (
                      <p className="text-muted">Няма добавени услуги</p>
                    ) : (
                      <div className="list-group">
                        {services.map(service => {
                          const status = isExpiringType(service.serviceType) ? getServiceStatus(service.expiryDate) : null;
                          return (
                            <div key={service.id} className={`list-group-item ${status ? `list-group-item-${status.status === 'expired' ? 'danger' : status.status === 'warning' ? 'warning' : 'success'}` : ''}`}>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="mb-1">{getServiceIcon(service.serviceType)} {getServiceName(service.serviceType)}</h6>
                                  <p className="mb-1 small">
                                    {isExpiringType(service.serviceType) ? 'Изтича:' : 'Дата:'} {new Date(service.expiryDate).toLocaleDateString()}
                                  </p>
                                  {service.cost > 0 && <p className="mb-0 small">Цена: {service.cost} €</p>}
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  {status && (
                                    <span className={`badge bg-${status.status === 'expired' ? 'danger' : status.status === 'warning' ? 'warning' : 'success'}`}>
                                      {status.text}
                                    </span>
                                  )}
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteService(service.id)}>
                                    Изтрий
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="tab-content-staging">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h3 mb-0">📁 Документи</h2>
            </div>
            <div className="alert alert-info">
              Функционалност за документи - Скоро
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="tab-content-staging">
            <h2 className="h3 mb-4">⚙️ Настройки</h2>
            
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Профилна информация</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Имейл</label>
                  <input type="email" className="form-control" value={user?.email || ''} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Име</label>
                  <input type="text" className="form-control" value={user?.name || ''} disabled />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Настройки за напомняния</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Дни преди изтичане за напомняне</label>
                  <select className="form-select" value={reminderDays} onChange={(e) => handleReminderDaysChange(e.target.value)}>
                    <option value="7">7 дни</option>
                    <option value="14">14 дни</option>
                    <option value="30">30 дни</option>
                    <option value="60">60 дни</option>
                  </select>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={reminderEnabled} onChange={(e) => handleReminderEnabledChange(e.target.checked)} />
                  <label className="form-check-label">
                    Активирай имейл напомняния
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCarForm && (
        <div className="modal show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingCar ? 'Редактирай кола' : 'Добави нова кола'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCarForm(false); setEditingCar(null); }}></button>
              </div>
              <div className="modal-body">
                <CarForm 
                  onSubmit={handleAddCar} 
                  onCancel={() => { setShowCarForm(false); setEditingCar(null); }} 
                  initialData={editingCar}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showServiceForm && selectedCar && (
        <div className="modal show d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Добави услуга за {selectedCar.brand} {selectedCar.model}</h5>
                <button type="button" className="btn-close" onClick={() => setShowServiceForm(false)}></button>
              </div>
              <div className="modal-body">
                <ServiceForm 
                  carId={selectedCar.id}
                  onSubmit={handleAddService} 
                  onCancel={() => setShowServiceForm(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Car Picker Modal */}
      {showCarPicker && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}} onClick={() => setShowCarPicker(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{borderRadius:'16px', overflow:'hidden'}}>
              <div className="modal-header" style={{background:'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', color:'#fff', border:'none'}}>
                <h5 className="modal-title fw-bold">
                  {carPickerMode === 'service' ? '🔧 Избери автомобил за услуга' : '📄 Избери автомобил за отчет'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCarPicker(false)}></button>
              </div>
              <div className="modal-body p-3">
                <div className="d-flex flex-column gap-2">
                  {cars.map(car => (
                    <div
                      key={car.id}
                      onClick={() => setCarPickerSelected(car)}
                      style={{
                        display:'flex', alignItems:'center', gap:'1rem',
                        padding:'0.85rem 1rem', borderRadius:'12px', cursor:'pointer',
                        border: `2px solid ${carPickerSelected?.id === car.id ? '#dc3545' : '#e9ecef'}`,
                        background: carPickerSelected?.id === car.id ? '#fff5f5' : '#f8f9fa',
                        transition:'all 0.15s'
                      }}
                    >
                      {getBrandLogo(car.brand) ? (
                        <img src={getBrandLogo(car.brand)} alt={car.brand} style={{width:'38px', height:'38px', objectFit:'contain'}} />
                      ) : (
                        <i className="bi bi-car-front-fill" style={{fontSize:'1.8rem', color:'#6c757d'}}></i>
                      )}
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700, color:'#1a1a1a'}}>{car.brand} {car.model}</div>
                        <div style={{fontSize:'0.82rem', color:'#6c757d'}}>{car.year} г. · {car.licensePlate}</div>
                      </div>
                      {carPickerSelected?.id === car.id && (
                        <i className="bi bi-check-circle-fill" style={{color:'#dc3545', fontSize:'1.2rem'}}></i>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer" style={{border:'none'}}>
                <button className="btn btn-outline-secondary" onClick={() => setShowCarPicker(false)}>Отказ</button>
                <button className="btn btn-danger" disabled={!carPickerSelected} onClick={handleCarPickerConfirm}>
                  {carPickerMode === 'service' ? '➕ Добави услуга' : '📄 Генерирай отчет'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
