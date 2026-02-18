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
  const DEFAULT_REMINDER_SETTINGS = { maintenance: 30, tax: 30, fire_extinguisher: 30, inspection: 30, casco: 30, vignette: 30, civil_liability: 30 };
  const [reminderSettings, setReminderSettings] = useState(DEFAULT_REMINDER_SETTINGS);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [carPickerMode, setCarPickerMode] = useState(null); // 'service' | 'pdf'
  const [carPickerSelected, setCarPickerSelected] = useState(null);
  const [docFilterCar, setDocFilterCar] = useState('all');
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docUploadCar, setDocUploadCar] = useState(null);
  const [docUploadFile, setDocUploadFile] = useState(null);
  const [docUploadNote, setDocUploadNote] = useState('');
  const [docUploading, setDocUploading] = useState(false);

  const { user, logout, updateReminderDays: updateReminderDaysContext, updateReminderEnabled: updateReminderEnabledContext, updateReminderSettings: updateReminderSettingsContext, isInitialized } = useAuth();
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

  const handleReminderSettingChange = async (serviceType, days) => {
    const updated = { ...reminderSettings, [serviceType]: parseInt(days) };
    setReminderSettings(updated);
    try {
      await updateReminderSettingsContext(updated);
    } catch (err) {
      console.error('Error saving reminder settings:', err);
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
    } else if (typeof user?.reminder_enabled === 'boolean') {
      setReminderEnabled(user.reminder_enabled);
    } else {
      setReminderEnabled(true);
    }
    if (user?.reminder_settings && Object.keys(user.reminder_settings).length > 0) {
      setReminderSettings({ ...DEFAULT_REMINDER_SETTINGS, ...user.reminder_settings });
    }
    loadCars();
    loadAllServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, user?.reminderDays, user?.reminder_days, user?.reminderEnabled, user?.reminder_enabled, user?.reminder_settings]);

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

  const handleDocUpload = async () => {
    if (!docUploadFile || !docUploadCar) return;
    setDocUploading(true);
    try {
      const tempService = await servicesService.createService({
        carId: docUploadCar.id,
        userId: user.id,
        serviceType: 'other',
        expiryDate: new Date().toISOString().split('T')[0],
        cost: 0,
        notes: docUploadNote || docUploadFile.name,
      });
      const fileUrl = await servicesService.uploadFile(docUploadFile, user.id, tempService.id);
      await servicesService.updateService(tempService.id, { fileUrl });
      loadAllServices();
      setShowDocUpload(false);
      setDocUploadFile(null);
      setDocUploadNote('');
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setDocUploading(false);
    }
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
      'tires': null,
      'refuel': '⛽',
      'other': '📝'
    };
    if (type === 'tires') return <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'inline',verticalAlign:'middle',marginRight:'2px'}}><circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="10"/><circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="8"/><line x1="50" y1="28" x2="50" y2="72" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/><line x1="28" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/><line x1="35" y1="35" x2="65" y2="65" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/><line x1="65" y1="35" x2="35" y2="65" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/></svg>;
    return icons[type] || '📋';
  };

  const getServiceName = (type) => {
    const names = {
      'civil_liability': 'Civil Liability Insurance',
      'vignette': 'Vignette',
      'inspection': 'Yearly Inspection',
      'casco': 'Casco Insurance',
      'tax': 'Vehicle Tax',
      'fire_extinguisher': 'Fire Extinguisher',
      'repair': 'Repair',
      'maintenance': 'Maintenance',
      'tires': 'Tire Change',
      'refuel': 'Refuel',
      'other': 'Other'
    };
    return names[type] || type;
  };

  const getServiceStatus = (expiryDate, serviceType) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    const threshold = (serviceType && reminderSettings[serviceType]) ? reminderSettings[serviceType] : reminderDays;
    if (daysLeft < 0) return { status: 'expired', text: 'Expired!', class: 'status-expired' };
    if (daysLeft <= threshold) return { status: 'warning', text: `${daysLeft} days`, class: 'status-warning' };
    return { status: 'ok', text: `${daysLeft} days`, class: 'status-ok' };
  };

  const isExpiringType = (type) => {
    return ['civil_liability', 'vignette', 'inspection', 'casco', 'tax', 'fire_extinguisher', 'maintenance'].includes(type);
  };

  // Calculate statistics
  const stats = {
    totalCars: cars.length,
    upcomingServices: services.filter(s => {
      if (!isExpiringType(s.serviceType)) return false;
      const status = getServiceStatus(s.expiryDate, s.serviceType);
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
              Log out
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
              <span>Overview</span>
            </button>
            <button className={`tab-btn ${activeTab === 'cars' ? 'active' : ''}`} onClick={() => setActiveTab('cars')}>
              <i className="bi bi-car-front"></i>
              <span>My Vehicles</span>
            </button>
            <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
              <i className="bi bi-wrench"></i>
              <span>Services</span>
            </button>
            <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
              <i className="bi bi-folder"></i>
              <span>Documents</span>
            </button>
            <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <i className="bi bi-gear"></i>
              <span>Settings</span>
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
              <h1><i className="bi bi-emoji-smile"></i> Welcome back, {user?.name || user?.email?.split('@')[0]}!</h1>
              <p>Here's an overview of your vehicles and upcoming services</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-car-front-fill"></i>
                </div>
                <div className="stat-value">{stats.totalCars.toLocaleString('en-US')}</div>
                <div className="stat-label">Vehicles</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                </div>
                <div className="stat-value">{stats.upcomingServices.toLocaleString('en-US')}</div>
                <div className="stat-label">Upcoming Deadlines</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="stat-value">{stats.totalServices.toLocaleString('en-US')}</div>
                <div className="stat-label">Completed Services</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-cash-coin"></i>
                </div>
                <div className="stat-value">{Math.round(stats.totalCosts).toLocaleString('en-US')}</div>
                <div className="stat-label">Total Costs (€)</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <div className="quick-action-btn" onClick={() => { setActiveTab('cars'); setShowCarForm(true); }}>
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
              <div className="quick-action-btn" onClick={() => setActiveTab('settings')}>
                <i className="bi bi-gear"></i>
                <h4>Settings</h4>
              </div>
            </div>

            {/* Notifications Section */}
            {services.length > 0 && (
              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title">
                    <i className="bi bi-bell-fill"></i>
                    Important Reminders
                  </h2>
                </div>
                {services.filter(s => isExpiringType(s.serviceType)).slice(0, 5).map(service => {
                  const status = getServiceStatus(service.expiryDate, service.serviceType);
                  const daysDiff = Math.ceil((new Date(service.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={service.id} className={`notification-item ${status.status === 'expired' ? 'urgent' : ''}`}>
                      <i className={`bi bi-${status.status === 'expired' ? 'exclamation-triangle-fill' : 'info-circle-fill'}`}></i>
                      <div className="notification-content">
                        <h5>{getServiceName(service.serviceType)} for {cars.find(c => c.id === service.carId)?.brand} {cars.find(c => c.id === service.carId)?.model} expires in {daysDiff < 0 ? 0 : daysDiff} day(s){status.status === 'expired' ? '!' : ''}</h5>
                        <p>Deadline: {new Date(service.expiryDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
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
                    My Vehicles
                  </h2>
                  <button className="btn-outline-custom" onClick={() => setActiveTab('cars')}>
                    View all <i className="bi bi-arrow-right"></i>
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
                          <span>Year: {car.year}</span>
                        </div>
                        <div className="car-info-item">
                          <i className="bi bi-hash"></i>
                          <span>Plate: {car.licensePlate}</span>
                        </div>
                        {car.mileage && (
                          <div className="car-info-item">
                            <i className="bi bi-speedometer"></i>
                            <span>{car.mileage.toLocaleString()} km</span>
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
              <h2 className="h3 mb-0">🚗 My Vehicles</h2>
              <button className="btn btn-danger" onClick={() => setShowCarForm(true)}>
                ➕ Add Vehicle
              </button>
            </div>

            {cars.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No vehicles added yet. Click "Add Vehicle" to get started!</p>
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
                              <p className="mb-0 small text-muted">Year: {car.year}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <FaHashtag className="me-2" />
                          <strong>Plate:</strong> {car.licensePlate}
                        </div>
                        {car.vin && (
                          <div className="mb-2">
                            <FaBarcode className="me-2" />
                            <strong>VIN:</strong> {car.vin}
                          </div>
                        )}
                        <div className="d-flex gap-2 mt-3">
                          <button className="btn btn-sm btn-outline-primary" onClick={(e) => { e.stopPropagation(); handleEditCar(car); }}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteCar(car.id); }}>
                            Delete
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
                      <div style={{opacity:0.85, fontSize:'0.88rem'}}>{selectedCar.year} · {selectedCar.licensePlate}</div>
                    </div>
                  </div>
                  <div style={{padding:'1.5rem'}}>
                    <h6 style={{fontWeight:700, color:'#dc3545', marginBottom:'1rem'}}><i className="bi bi-info-circle me-2"></i>Basic Info</h6>
                    <div className="row g-3 mb-4">
                      {[
                        { icon: 'bi-calendar2', label: 'Year', value: selectedCar.year },
                        { icon: 'bi-hash', label: 'Plate', value: selectedCar.licensePlate },
                        { icon: 'bi-upc-scan', label: 'VIN', value: selectedCar.vin },
                        { icon: 'bi-lightning-charge', label: 'Engine', value: selectedCar.engineType },
                        { icon: 'bi-speedometer2', label: 'Horsepower', value: selectedCar.horsepower ? `${selectedCar.horsepower} HP` : null },
                        { icon: 'bi-fuel-pump', label: 'Fuel', value: selectedCar.fuelType },
                        { icon: 'bi-speedometer', label: 'Mileage', value: selectedCar.mileage ? `${Number(selectedCar.mileage).toLocaleString()} km` : null },
                        { icon: 'bi-palette', label: 'Color', value: selectedCar.color },
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
                        <h6 style={{fontWeight:700, color:'#dc3545', marginBottom:'1rem'}}><i className="bi bi-circle me-2"></i>Tires</h6>
                        <div className="row g-3 mb-4">
                          {[
                            { icon: 'bi-arrows-expand', label: 'Size', value: [selectedCar.tireWidth, selectedCar.tireHeight, selectedCar.tireDiameter].filter(Boolean).join('/') || null },
                            { icon: 'bi-tag', label: 'Tire Brand', value: selectedCar.tireBrand },
                            { icon: 'bi-thermometer-half', label: 'Season', value: selectedCar.tireSeason },
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
                    <h6 style={{fontWeight:700, color:'#dc3545', marginBottom:'1rem'}}><i className="bi bi-wrench me-2"></i>Services</h6>
                    {services.length === 0 ? (
                      <div style={{color:'#6c757d', padding:'1rem 0'}}>No services added</div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {services.map(service => {
                          const status = isExpiringType(service.serviceType) ? getServiceStatus(service.expiryDate, service.serviceType) : null;
                          const statusColor = status?.status === 'expired' ? '#dc3545' : status?.status === 'warning' ? '#fd7e14' : '#198754';
                          return (
                            <div key={service.id} style={{background:'#f8f9fa', borderRadius:'10px', padding:'0.75rem 1rem', borderLeft:`4px solid ${status ? statusColor : '#dee2e6'}`}}>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div style={{fontWeight:600}}>{getServiceIcon(service.serviceType)} {getServiceName(service.serviceType)}</div>
                                  <div style={{fontSize:'0.82rem', color:'#6c757d'}}>
                                    {service.expiryDate && <span>{isExpiringType(service.serviceType) ? 'Expires:' : 'Date:'} {new Date(service.expiryDate).toLocaleDateString('en-US')}</span>}
                                    {service.cost > 0 && <span className="ms-3">💰 {service.cost} €</span>}
                                    {service.mileage > 0 && <span className="ms-3">🛣️ {Number(service.mileage).toLocaleString()} km</span>}
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
              <h2 className="h3 mb-0">🔧 Services</h2>
              <button className="btn btn-danger" onClick={() => setShowServiceForm(true)} disabled={!selectedCar}>
                ➕ Add Service
              </button>
            </div>

            {!selectedCar ? (
              <div className="alert alert-info">Please select a vehicle first</div>
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
                    <h5 className="mb-0">Services for {selectedCar.brand} {selectedCar.model}</h5>
                  </div>
                  <div className="card-body">
                    {services.length === 0 ? (
                      <p className="text-muted">No services added</p>
                    ) : (
                      <div className="list-group">
                        {services.map(service => {
                          const status = isExpiringType(service.serviceType) ? getServiceStatus(service.expiryDate, service.serviceType) : null;
                          return (
                            <div key={service.id} className={`list-group-item ${status ? `list-group-item-${status.status === 'expired' ? 'danger' : status.status === 'warning' ? 'warning' : 'success'}` : ''}`}>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="mb-1">{getServiceIcon(service.serviceType)} {getServiceName(service.serviceType)}</h6>
                                  <p className="mb-1 small">
                                    {isExpiringType(service.serviceType) ? 'Expires:' : 'Date:'} {new Date(service.expiryDate).toLocaleDateString('en-US')}
                                  </p>
                                  {service.cost > 0 && <p className="mb-0 small">Cost: {service.cost} €</p>}
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  {status && (
                                    <span className={`badge bg-${status.status === 'expired' ? 'danger' : status.status === 'warning' ? 'warning' : 'success'}`}>
                                      {status.text}
                                    </span>
                                  )}
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteService(service.id)}>
                                    Delete
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
        {activeTab === 'documents' && (() => {
          const docs = allServices.filter(s => s.fileUrl);
          const filtered = docFilterCar === 'all' ? docs : docs.filter(s => s.carId === docFilterCar);
          const getFileName = (url) => {
            try { return decodeURIComponent(url.split('/').pop().split('?')[0]); } catch { return 'document'; }
          };
          const getFileExt = (url) => {
            const name = getFileName(url);
            return name.split('.').pop().toLowerCase();
          };
          const extIcon = (ext) => {
            if (ext === 'pdf') return '📄';
            if (['jpg','jpeg','png','webp','gif'].includes(ext)) return '🖼️';
            return '📎';
          };
          return (
            <div className="tab-content-staging">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h3 mb-0">📁 Documents</h2>
                <button
                  onClick={() => { setDocUploadCar(cars[0] || null); setShowDocUpload(true); }}
                  style={{
                    background: 'linear-gradient(135deg,#dc3545,#c82333)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '0.6rem 1.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 12px rgba(220,53,69,0.3)',
                  }}
                >
                  <i className="bi bi-upload"></i> Upload Document
                </button>
              </div>

              {/* Car filter pills */}
              {cars.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  <button
                    onClick={() => setDocFilterCar('all')}
                    style={{
                      padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                      border: `2px solid ${docFilterCar === 'all' ? '#dc3545' : '#e9ecef'}`,
                      background: docFilterCar === 'all' ? '#dc3545' : '#f8f9fa',
                      color: docFilterCar === 'all' ? '#fff' : '#495057',
                      cursor: 'pointer',
                    }}
                  >All vehicles</button>
                  {cars.map(car => (
                    <button key={car.id}
                      onClick={() => setDocFilterCar(car.id)}
                      style={{
                        padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                        border: `2px solid ${docFilterCar === car.id ? '#dc3545' : '#e9ecef'}`,
                        background: docFilterCar === car.id ? '#dc3545' : '#f8f9fa',
                        color: docFilterCar === car.id ? '#fff' : '#495057',
                        cursor: 'pointer',
                      }}
                    >{car.brand} {car.model}</button>
                  ))}
                </div>
              )}

              {/* Upload modal */}
              {showDocUpload && (
                <div style={{
                  background: '#fff',
                  border: '2px solid #e9ecef',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                }}>
                  <h5 style={{ fontWeight: 800, marginBottom: '1rem' }}>📎 Upload Document</h5>

                  {/* Car selector */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6c757d', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Vehicle</label>
                    <select
                      value={docUploadCar?.id || ''}
                      onChange={e => setDocUploadCar(cars.find(c => c.id === parseInt(e.target.value)))}
                      style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '10px', border: '2px solid #e9ecef', fontSize: '0.95rem', outline: 'none' }}
                    >
                      {cars.map(car => <option key={car.id} value={car.id}>{car.brand} {car.model} ({car.year})</option>)}
                    </select>
                  </div>

                  {/* Note */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6c757d', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Document name / note</label>
                    <input
                      type="text"
                      value={docUploadNote}
                      onChange={e => setDocUploadNote(e.target.value)}
                      placeholder="e.g. Insurance contract 2026"
                      style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '10px', border: '2px solid #e9ecef', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* File input */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6c757d', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>File</label>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', borderRadius: '10px',
                      border: `2px dashed ${docUploadFile ? '#dc3545' : '#ced4da'}`,
                      background: docUploadFile ? '#fff5f5' : '#f8f9fa',
                      cursor: 'pointer', fontWeight: 600, color: docUploadFile ? '#dc3545' : '#6c757d',
                    }}>
                      <i className="bi bi-file-earmark-arrow-up" style={{ fontSize: '1.3rem' }}></i>
                      {docUploadFile ? docUploadFile.name : 'Click to select a file (PDF, JPG, PNG)'}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                        onChange={e => setDocUploadFile(e.target.files[0] || null)} />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowDocUpload(false); setDocUploadFile(null); setDocUploadNote(''); }}
                      style={{ padding: '0.55rem 1.4rem', borderRadius: '50px', border: '2px solid #e9ecef', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >Cancel</button>
                    <button onClick={handleDocUpload} disabled={!docUploadFile || !docUploadCar || docUploading}
                      style={{
                        padding: '0.55rem 1.4rem', borderRadius: '50px', border: 'none',
                        background: (!docUploadFile || !docUploadCar || docUploading) ? '#adb5bd' : 'linear-gradient(135deg,#dc3545,#c82333)',
                        color: '#fff', fontWeight: 700, cursor: (!docUploadFile || !docUploadCar || docUploading) ? 'not-allowed' : 'pointer',
                      }}
                    >{docUploading ? 'Uploading…' : '⬆ Upload'}</button>
                  </div>
                </div>
              )}

              {/* Documents grid */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#adb5bd' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>No documents yet</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Attach files when adding a service or use Upload Document above.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                  {filtered.map(svc => {
                    const car = cars.find(c => c.id === svc.carId);
                    const ext = getFileExt(svc.fileUrl);
                    const isImage = ['jpg','jpeg','png','webp','gif'].includes(ext);
                    return (
                      <div key={svc.id} style={{
                        background: '#fff',
                        border: '2px solid #e9ecef',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='#dc3545'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(220,53,69,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='#e9ecef'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.06)'; }}
                      >
                        {/* Preview */}
                        {isImage ? (
                          <img src={svc.fileUrl} alt="doc" style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '10px', background: '#f8f9fa' }} />
                        ) : (
                          <div style={{ width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff5f5', borderRadius: '10px', fontSize: '2.5rem' }}>
                            {extIcon(ext)}
                          </div>
                        )}

                        {/* Info */}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '0.25rem' }}>
                            {getServiceIcon(svc.serviceType)} {getServiceName(svc.serviceType)}
                          </div>
                          {svc.notes && <div style={{ fontSize: '0.82rem', color: '#6c757d', marginBottom: '0.25rem' }}>{svc.notes}</div>}
                          {car && <div style={{ fontSize: '0.82rem', color: '#dc3545', fontWeight: 700 }}>🚗 {car.brand} {car.model}</div>}
                          <div style={{ fontSize: '0.8rem', color: '#adb5bd', marginTop: '0.2rem' }}>
                            {svc.expiryDate ? new Date(svc.expiryDate).toLocaleDateString('en-US') : ''}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                          <a href={svc.fileUrl} target="_blank" rel="noreferrer" style={{
                            flex: 1, textAlign: 'center', padding: '0.45rem 0',
                            borderRadius: '50px', border: '2px solid #dc3545',
                            color: '#dc3545', fontWeight: 700, fontSize: '0.85rem',
                            textDecoration: 'none', transition: 'all 0.2s',
                          }}>👁 View</a>
                          <a href={svc.fileUrl} download style={{
                            flex: 1, textAlign: 'center', padding: '0.45rem 0',
                            borderRadius: '50px', border: 'none',
                            background: 'linear-gradient(135deg,#dc3545,#c82333)',
                            color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                            textDecoration: 'none', transition: 'all 0.2s',
                          }}>⬇ Download</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="tab-content-staging">
            <h2 className="h3 mb-4">⚙️ Settings</h2>
            
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Profile Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={user?.email || ''} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" value={user?.name || ''} disabled />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">⏰ Reminder Settings</h5>
              </div>
              <div className="card-body">
                <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Set how many days before expiry you want to be reminded for each service type.</p>
                {[
                  { key: 'civil_liability', label: '🛡️ Civil Liability Insurance' },
                  { key: 'casco',           label: '💎 Casco Insurance' },
                  { key: 'vignette',        label: '🛣️ Vignette' },
                  { key: 'inspection',      label: '🔧 Yearly Inspection' },
                  { key: 'tax',             label: '💰 Vehicle Tax' },
                  { key: 'fire_extinguisher', label: '🔴 Fire Extinguisher' },
                  { key: 'maintenance',     label: '🛢️ Maintenance' },
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{label}</span>
                    <select
                      className="form-select"
                      value={reminderSettings[key] || 30}
                      onChange={e => handleReminderSettingChange(key, e.target.value)}
                      style={{ width: '130px', fontSize: '0.9rem' }}
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                    </select>
                  </div>
                ))}
                <div className="form-check mt-3">
                  <input className="form-check-input" type="checkbox" checked={reminderEnabled} onChange={(e) => handleReminderEnabledChange(e.target.checked)} />
                  <label className="form-check-label">
                    Enable email reminders
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
                <h5 className="modal-title">{editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}</h5>
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
                <h5 className="modal-title">Add Service for {selectedCar.brand} {selectedCar.model}</h5>
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
                  {carPickerMode === 'service' ? '🔧 Select vehicle for service' : '📄 Select vehicle for report'}
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
                        <div style={{fontSize:'0.82rem', color:'#6c757d'}}>{car.year} · {car.licensePlate}</div>
                      </div>
                      {carPickerSelected?.id === car.id && (
                        <i className="bi bi-check-circle-fill" style={{color:'#dc3545', fontSize:'1.2rem'}}></i>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer" style={{border:'none'}}>
                <button className="btn btn-outline-secondary" onClick={() => setShowCarPicker(false)}>Cancel</button>
                <button className="btn btn-danger" disabled={!carPickerSelected} onClick={handleCarPickerConfirm}>
                  {carPickerMode === 'service' ? '➕ Add Service' : '📄 Generate Report'}
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
