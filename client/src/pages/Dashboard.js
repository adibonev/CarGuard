import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import carsService from '../lib/supabaseCars';
import servicesService from '../lib/supabaseServices';
import { generateCarReport } from '../lib/pdfService';
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
  const [reminderEnabled, setReminderEnabled] = useState(true);
  
  // States for Events Filter
  const [eventFilterType, setEventFilterType] = useState('all');
  const [eventFilterYear, setEventFilterYear] = useState(new Date().getFullYear().toString());
  
  // States for Chart Filters
  const [chartFilterCar, setChartFilterCar] = useState('all');
  const [chartFilterService, setChartFilterService] = useState('all');
  const [chartPeriod, setChartPeriod] = useState('6');
  
  // States for Documents Filter
  const [docFilterType, setDocFilterType] = useState('all');
  
  // States for Document Upload Form
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [docFormData, setDocFormData] = useState({
    carId: '',
    category: 'other',
    file: null,
    notes: ''
  });
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout, updateReminderDays: updateReminderDaysContext, updateReminderEnabled: updateReminderEnabledContext, isInitialized } = useAuth();
  const logoUrl = `${process.env.PUBLIC_URL || ''}/logo.png`;

  // Handle logout and redirect to home page
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
    // Wait for app to initialize before loading data
    if (!isInitialized) return;
    
    // Initialize reminder days from user profile
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
      // Get all services for all cars of this user
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
        // Edit
        await carsService.updateCar(editingCar.id, carData);
        setEditingCar(null);
      } else {
        // Add
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

  const handleCarChangeForService = (carId) => {
    const car = cars.find(c => c.id === parseInt(carId));
    if (car) {
      setSelectedCar(car);
    }
  };

  const handleAddService = async (serviceData) => {
    try {
      console.log('Adding service:', serviceData);
      console.log('Current user:', user);
      console.log('User ID:', user?.id);
      
      let fileUrl = null;
      
      // Upload file if present
      if (serviceData.file) {
        try {
          // Create service first to get ID, then upload file
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
          
          // Upload file with service ID
          fileUrl = await servicesService.uploadFile(serviceData.file, user.id, tempService.id);
          
          // Update service with file URL
          await servicesService.updateService(tempService.id, { fileUrl });
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          alert('Error uploading file. Service saved without file.');
        }
      } else {
        // No file, just create service
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

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    
    if (!docFormData.carId) {
      alert('Please select a vehicle');
      return;
    }
    
    if (!docFormData.file) {
      alert('Please select a file');
      return;
    }
    
    try {
      // Create a service entry with just the document
      const serviceData = {
        carId: parseInt(docFormData.carId),
        userId: user.id,
        serviceType: docFormData.category,
        expiryDate: new Date().toISOString(),
        cost: 0,
        notes: docFormData.notes || `Uploaded document: ${docFormData.category}`,
        mileage: null
      };
      
      // Create service first
      const service = await servicesService.createService(serviceData);
      
      // Upload file
      const fileUrl = await servicesService.uploadFile(docFormData.file, user.id, service.id);
      
      // Update service with file URL
      await servicesService.updateService(service.id, { fileUrl });
      
      // Reset form
      setDocFormData({ carId: '', category: 'other', file: null, notes: '' });
      setShowDocumentForm(false);
      
      // Reload services
      if (selectedCar) {
        loadServices(selectedCar.id);
      }
      loadAllServices();
      
      alert('Document uploaded successfully! ✅');
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Error uploading document: ' + err.message);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedCar) {
      alert('Please select a vehicle');
      return;
    }
    
    try {
      await generateCarReport(selectedCar, allServices.filter(s => s.carId === selectedCar.id));
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF: ' + err.message);
    }
  };

  const handleDeleteDocument = async (serviceId, fileUrl) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      // Delete the file from storage
      if (fileUrl) {
        await servicesService.deleteFile(fileUrl);
      }
      
      // Delete the service record
      await servicesService.deleteService(serviceId);
      
      // Reload services
      if (selectedCar) {
        loadServices(selectedCar.id);
      }
      loadAllServices();
      
      alert('Document deleted successfully! ✅');
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Error deleting document: ' + err.message);
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

  const getExpiringServices = () => {
    const expiringTypes = ['civil_liability', 'vignette', 'inspection', 'casco', 'tax', 'fire_extinguisher'];
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

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

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
            <span className="stat-box-label">Vehicles</span>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon services">📋</div>
          <div className="stat-box-content">
            <span className="stat-box-value">{allServices.length}</span>
            <span className="stat-box-label">Total Events</span>
          </div>
        </div>
        <div className="stat-box warning">
          <div className="stat-box-icon">⚠️</div>
          <div className="stat-box-content">
            <span className="stat-box-value">{getExpiringServices().length}</span>
            <span className="stat-box-label">Expiring Soon</span>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-icon money">💰</div>
          <div className="stat-box-content">
            <span className="stat-box-value">{getTotalCosts().toFixed(0)} BGN</span>
            <span className="stat-box-label">Total Costs</span>
          </div>
        </div>
      </div>

      {cars.length === 0 ? (
        <div className="empty-state-dashboard">
          <div className="empty-icon">🚗</div>
          <h3>Add your first vehicle</h3>
          <p>Start tracking insurance and vignette deadlines</p>
          <button className="primary-btn" onClick={() => { setActiveTab('cars'); setShowCarForm(true); }}>
            + Add Vehicle
          </button>
        </div>
      ) : (
        <div className="dashboard-main-grid">
          {/* Calendar Section */}
          <div className="dashboard-section calendar-section">
            <div className="section-title">
              <h3>📅 Upcoming Events Calendar</h3>
              <div className="calendar-nav">
                <button onClick={() => navigateMonth(-1)}>‹</button>
                <span>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                <button onClick={() => navigateMonth(1)}>›</button>
              </div>
            </div>
            <div className="calendar-grid">
              <div className="calendar-header">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
              <div className="calendar-days">
                {getMonthDays(currentMonth).map((day, idx) => {
                  const events = day ? getEventsForDay(day) : [];
                  const isToday = day && day.toDateString() === new Date().toDateString();
                  const expiringTypes = ['civil_liability', 'vignette', 'inspection', 'casco', 'tax', 'fire_extinguisher'];
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
              <h3>📊 Monthly Expenses</h3>
              <div className="chart-filters">
                <select 
                  value={chartFilterCar} 
                  onChange={(e) => setChartFilterCar(e.target.value)}
                  className="chart-filter-select"
                >
                  <option value="all">🚗 All vehicles</option>
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
                  <option value="all">📋 All Costs</option>
                  <option value="civil_liability">🛡️ Civil Liability</option>
                  <option value="vignette">🎫 Vignette</option>
                  <option value="inspection">🔧 Technical Inspection</option>
                  <option value="casco">🔒 CASCO</option>
                  <option value="tax">💰 Vehicle Tax</option>
                  <option value="fire_extinguisher">🧯 Fire Extinguisher</option>
                  <option value="repair">🔨 Repair</option>
                  <option value="maintenance">⚙️ Maintenance</option>
                  <option value="tires">🚗 Tires</option>
                  <option value="refuel">⛽ Refuel</option>
                  <option value="other">📝 Other</option>
                </select>
                <select 
                  value={chartPeriod} 
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="chart-filter-select"
                >
                  <option value="3">📅 3 months</option>
                  <option value="6">📅 6 months</option>
                  <option value="12">📅 12 months</option>
                </select>
              </div>
            </div>
            <div className="chart-container">
              {allServices.length > 0 && allServices.some(s => parseFloat(s.cost) > 0) ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value} BGN`} />
                    <Tooltip 
                      formatter={(value, name) => [`${value} BGN`, name]}
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
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-chart-data">
                  <span>📊</span>
                  <p>No expense data</p>
                  <small>Add services with a cost to see the chart</small>
                </div>
              )}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="dashboard-section notifications-section">
            <div className="section-title">
              <h3>🔔 Reminders</h3>
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
                      title: `${getServiceName(service.serviceType)} expired!`,
                      message: `${car?.brand} ${car?.model} - expired on ${expiryDate.toLocaleDateString('en-GB')}`,
                      time: 'Urgent'
                    });
                  } else if (daysLeft <= 7) {
                    notifications.push({
                      id: `warn-${service.id}`,
                      type: 'warning',
                      icon: '⚠️',
                      title: `${getServiceName(service.serviceType)} expires soon`,
                      message: `${car?.brand} ${car?.model} - ${daysLeft} days left`,
                      time: `${daysLeft} days`
                    });
                  } else if (daysLeft <= 30) {
                    notifications.push({
                      id: `info-${service.id}`,
                      type: 'info',
                      icon: '📋',
                      title: `Reminder for ${getServiceName(service.serviceType)}`,
                      message: `${car?.brand} ${car?.model} - expires on ${expiryDate.toLocaleDateString('en-GB')}`,
                      time: `${daysLeft} days`
                    });
                  }
                });

                if (notifications.length === 0) {
                  return (
                    <div className="no-notifications">
                      <span>🔔</span>
                      <p>No new notifications</p>
                      <small>All your vehicles are up to date</small>
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
          <div className="logo-orbit logo-orbit--loading">
            <img src={logoUrl} alt="CarGuard logo" className="loading-logo" />
          </div>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <div className="cars-layout">
          {showCarForm && (
            <div className="modal-overlay">
              <div className="modal-content-wrapper">
                <div className="modal-header">
                  <h3>{editingCar ? 'Edit vehicle' : 'Add new vehicle'}</h3>
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
              <h3>🚘 Vehicles ({cars.length})</h3>
              <button 
                className="add-car-btn" 
                onClick={() => { setShowCarForm(true); setEditingCar(null); }}
              >
                + Add
              </button>
            </div>
            
            <div className="cars-list-scroll">
              {cars.length === 0 ? (
                <div className="empty-cars">
                  <span>🚗</span>
                  <p>You have no vehicles</p>
                  <button onClick={() => setShowCarForm(true)}>Add your first</button>
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
                        <span className="car-list-year">{car.year} • {car.licensePlate || 'No plate'}</span>
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
                      <p>{selectedCar.year} {selectedCar.licensePlate && `• ${selectedCar.licensePlate}`}</p>
                    </div>
                  </div>
                  <div className="car-detail-actions">
                    <button 
                      className="action-btn pdf"
                      onClick={handleDownloadPDF}
                      title="Download PDF report"
                    >
                      📄 PDF Report
                    </button>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEditCar(selectedCar)}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteCar(selectedCar.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                <div className="car-detail-specs">
                  <div className="spec-card">
                    <div className="spec-icon"><FaHashtag /></div>
                    <div>
                      <h4>License plate</h4>
                      <p>{selectedCar.licensePlate || '—'}</p>
                    </div>
                  </div>
                  
                  <div className="spec-card">
                    <div className="spec-icon"><FaBarcode /></div>
                    <div>
                      <h4>VIN (Chassis)</h4>
                      <p>{selectedCar.vin || '—'}</p>
                    </div>
                  </div>

                  <div className="spec-card">
                    <div className="spec-icon"><FaCogs /></div>
                    <div>
                      <h4>Engine</h4>
                      <p>
                        {[
                          selectedCar.engineType === 'Benzin' ? 'Gasoline' :
                          selectedCar.engineType === 'Diesel' ? 'Diesel' :
                          selectedCar.engineType === 'Electric' ? 'Electric' :
                          selectedCar.engineType === 'Hybrid' ? 'Hybrid' :
                          selectedCar.engineType,
                          selectedCar.horsepower ? `${selectedCar.horsepower} HP` : null
                        ].filter(Boolean).join(', ') || '—'}
                      </p>
                      {selectedCar.euroStandard && <span>{selectedCar.euroStandard}</span>}
                    </div>
                  </div>

                  <div className="spec-card">
                    <div className="spec-icon"><FaExchangeAlt /></div>
                    <div>
                      <h4>Transmission</h4>
                      <p>
                        {selectedCar.transmission === 'Manual' ? 'Manual' : 
                         selectedCar.transmission === 'Automatic' ? 'Automatic' : 
                         selectedCar.transmission || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="spec-card">
                    <div className="spec-icon"><FaRoad /></div>
                    <div>
                      <h4>Mileage</h4>
                      <p>{selectedCar.mileage ? `${selectedCar.mileage.toLocaleString()} km` : '—'}</p>
                    </div>
                  </div>
                </div>

                {(selectedCar.tireWidth || selectedCar.tireDiameter || selectedCar.tireBrand) && (
                   <div className="car-tires-section">
                     <h4>Tires & Rims</h4>
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
                               {selectedCar.tireBrand || 'Unknown brand'}
                             </span>
                             {selectedCar.tireDot && (
                               <span className="tire-dot-badge">DOT {selectedCar.tireDot}</span>
                             )}
                           </div>
                           
                           <span className="tire-season-name">
                              {selectedCar.tireSeason === 'Summer' ? 'Summer tires' : 
                               selectedCar.tireSeason === 'Winter' ? 'Winter tires' : 
                               selectedCar.tireSeason === 'AllSeasons' ? 'All-season tires' : 'Unknown season'}
                           </span>
                        </div>
                     </div>
                   </div>
                )}

                <div className="car-services-section">
                  <div className="section-header">
                    <h3>📋 Services ({services.length})</h3>
                    <button 
                      className="add-service-btn"
                      onClick={() => setShowServiceForm(true)}
                    >
                      + Add service
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
                      <p>No services added for this vehicle</p>
                      <small>Add insurance, repair, or another service</small>
                    </div>
                  ) : (
                    <div className="services-grid-detail">
                      {services.map(service => {
                        const expiringTypes = ['civil_liability', 'vignette', 'inspection', 'casco', 'tax', 'fire_extinguisher'];
                        const isExpirable = expiringTypes.includes(service.serviceType);
                        const status = isExpirable ? getServiceStatus(service.expiryDate) : { class: 'status-neutral', text: '' };
                        
                        return (
                          <div key={service.id} className={`service-detail-card ${status.class}`}>
                            <div className="service-detail-icon">{getServiceIcon(service.serviceType)}</div>
                            <div className="service-detail-info">
                              <h4>{getServiceName(service.serviceType)}</h4>
                              <p>
                                {isExpirable ? 'Expires: ' : 'Date: '}
                                {new Date(service.expiryDate).toLocaleDateString('en-GB')}
                              </p>
                              {service.mileage && <span className="service-sub-info">🛣️ {service.mileage.toLocaleString()} km</span>}
                              {service.liters && <span className="service-sub-info">⛽ {service.liters}L</span>}
                              {service.fileUrl && (
                                <a 
                                  href={service.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="service-file-link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  📎 Document
                                </a>
                              )}
                              {service.cost > 0 && <span className="service-cost-badge">{service.cost.toFixed(2)} BGN</span>}
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
                <h3>Select a vehicle</h3>
                <p>Click a vehicle from the list to view details</p>
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
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
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
        <h2>📋 Services</h2>
        <button className="primary-btn" onClick={() => setShowServiceForm(!showServiceForm)}>
          {showServiceForm ? '✕ Close' : '+ Add service'}
        </button>
      </div>

      {cars.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>Add a vehicle first</h3>
          <p>To add a service, you need at least one vehicle</p>
          <button className="primary-btn" onClick={() => setActiveTab('cars')}>
            Go to vehicles →
          </button>
        </div>
      ) : (
        <>
          {showServiceForm && (
            <div className="form-container slide-in">
              <h3 className="form-title">➕ New service</h3>
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
                  <label>Vehicle:</label>
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
                  <label>Year:</label>
                  <select 
                    value={eventFilterYear} 
                    onChange={(e) => setEventFilterYear(e.target.value)}
                    className="control-select"
                  >
                    <option value="all">All</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div className="control-group">
                  <label>Category:</label>
                  <select 
                    value={eventFilterType} 
                    onChange={(e) => setEventFilterType(e.target.value)}
                    className="control-select"
                  >
                    <option value="all">All</option>
                    <option value="inspection">🔧 Technical Inspection</option>
                    <option value="civil_liability">🛡️ Civil Liability Insurance</option>
                    <option value="casco">💎 CASCO</option>
                    <option value="vignette">🛣️ Vignette</option>
                    <option value="tax">💰 Tax</option>
                    <option value="fire_extinguisher">🔴 Fire Extinguisher Check</option>
                    <option value="repair">🛠️ Repair</option>
                    <option value="maintenance">🛢️ Maintenance</option>
                    <option value="tires">🛞 Tire Change</option>
                    <option value="refuel">⛽ Refuel</option>
                    <option value="other">📝 Other</option>
                  </select>
                </div>
          </div>

          {/* Stats Summary */}
          <div className="events-stats-summary">
                <div className="event-stat-card">
                  <span className="ev-stat-label">Total costs</span>
                  <span className="ev-stat-value">
                      {filteredServices.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0).toFixed(2)} BGN
                  </span>
                </div>
                <div className="event-stat-card">
                  <span className="ev-stat-label">Total services</span>
                  <span className="ev-stat-value">{filteredServices.length}</span>
                </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="empty-state small">
              <div className="empty-icon">📅</div>
              <h3>No services found</h3>
              <p>No records for the selected filters</p>
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
                          <span className="service-date">{new Date(service.expiryDate).toLocaleDateString('en-GB')}</span>
                        </div>
                    </div>
                    
                    <div className="service-card-center">
                        {service.mileage && (
                            <div className="fuel-info">
                              <span>🛣️ {service.mileage.toLocaleString()} km</span>
                            </div>
                        )}
                        {service.serviceType === 'refuel' && service.liters && (
                            <div className="fuel-info">
                              <span>⛽ {service.liters} L</span>
                              {service.pricePerLiter && <span> • {service.pricePerLiter} BGN/L</span>}
                              {service.fuelType && <span> ({service.fuelType})</span>}
                            </div>
                        )}
                        {service.fileUrl && (
                            <div className="fuel-info">
                              <a 
                                href={service.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="service-file-link"
                              >
                                📎 View document
                              </a>
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
                          {service.cost > 0 ? `${parseFloat(service.cost).toFixed(2)} BGN` : '-'}
                        </span>
                        <button 
                          className="delete-mini-btn"
                          onClick={() => handleDeleteService(service.id)}
                          title="Delete"
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
                  <h3>📊 Expenses chart</h3>
                  <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={getExpensesChartData()}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                              <XAxis dataKey="name" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#999" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                              <Tooltip 
                                  formatter={(value) => [`${value} BGN`, 'Cost']}
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
        <h2>⚙️ Settings</h2>
      </div>

      <div className="settings-section">
        <h3>👤 Profile</h3>
        <div className="setting-item">
          <label>Name:</label>
          <span>{user?.name}</span>
        </div>
        <div className="setting-item">
          <label>Email:</label>
          <span>{user?.email}</span>
        </div>
      </div>

      <div className="settings-section">
        <h3>🔔 Reminders</h3>
        <div className="setting-item">
          <label>Email reminders:</label>
          <div className="reminder-toggle">
            <span className={`badge-status ${reminderEnabled ? 'active' : 'inactive'}`}>
              {reminderEnabled ? 'Active' : 'Inactive'}
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => handleReminderEnabledChange(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        <div className="setting-item">
          <label>Days before expiration:</label>
          <div className="reminder-days-control">
            <select 
              value={reminderDays} 
              onChange={(e) => handleReminderDaysChange(e.target.value)}
              className="reminder-select"
              disabled={!reminderEnabled}
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="45">45 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <button className="danger-btn" onClick={() => { logout(); navigate('/'); }}>
          🚪 Log out
        </button>
      </div>
    </div>
  );

  const renderDocuments = () => {
    // Get all services with files
    const documentsData = allServices
      .filter(s => s.fileUrl)
      .map(s => {
        const car = cars.find(c => c.id === s.carId);
        return {
          ...s,
          car
        };
      });

    // Filter by service type
    const filteredDocs = docFilterType === 'all' 
      ? documentsData 
      : documentsData.filter(d => d.serviceType === docFilterType);

    // Sort by date (newest first)
    const sortedDocs = [...filteredDocs].sort((a, b) => 
      new Date(b.expiryDate) - new Date(a.expiryDate)
    );

    return (
      <div className="tab-content documents-content">
        <div className="content-header">
          <h2>📁 Documents</h2>
        </div>

        <div className="documents-filter-bar">
          <select 
            value={docFilterType} 
            onChange={(e) => setDocFilterType(e.target.value)}
            className="doc-filter-select"
          >
            <option value="all">📋 All Documents ({documentsData.length})</option>
            <option value="civil_liability">🛡️ Civil Liability Insurance</option>
            <option value="vignette">🛣️ Vignette</option>
            <option value="inspection">🔧 Technical Inspection</option>
            <option value="casco">💎 CASCO</option>
            <option value="tax">💰 Vehicle Tax</option>
            <option value="fire_extinguisher">🔴 Fire Extinguisher</option>
            <option value="repair">🛠️ Repair</option>
            <option value="maintenance">🛢️ Maintenance</option>
            <option value="tires">🛞 Tires</option>
            <option value="refuel">⛽ Refuel</option>
            <option value="other">📝 Other</option>
          </select>
          
          <button 
            className="doc-add-btn"
            onClick={() => setShowDocumentForm(!showDocumentForm)}
          >
            {showDocumentForm ? '✖️ Close' : '➕ Add Document'}
          </button>
        </div>

        {showDocumentForm && (
          <div className="document-upload-form">
            <form onSubmit={handleDocumentUpload}>
              <div className="form-group">
                <label>Select vehicle</label>
                <select 
                  value={docFormData.carId || ''}
                  onChange={(e) => setDocFormData({ ...docFormData, carId: e.target.value })}
                  required
                >
                  <option value="">-- Select vehicle --</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} {car.year && `(${car.year})`} {car.licensePlate && `- ${car.licensePlate}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Document category</label>
                <select 
                  value={docFormData.category}
                  onChange={(e) => setDocFormData({ ...docFormData, category: e.target.value })}
                  required
                >
                  <option value="civil_liability">🛡️ Civil Liability Insurance</option>
                  <option value="vignette">🛣️ Vignette</option>
                  <option value="inspection">🔧 Technical Inspection</option>
                  <option value="casco">💎 CASCO</option>
                  <option value="tax">💰 Vehicle Tax</option>
                  <option value="fire_extinguisher">🔴 Fire Extinguisher</option>
                  <option value="repair">🛠️ Repair</option>
                  <option value="maintenance">🛢️ Maintenance</option>
                  <option value="tires">🛞 Tires</option>
                  <option value="other">📝 Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>File (PDF, JPG, PNG up to 50MB)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.size > 50 * 1024 * 1024) {
                      alert('File is too large. Maximum size: 50MB');
                      e.target.value = '';
                      return;
                    }
                    setDocFormData({ ...docFormData, file });
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={docFormData.notes}
                  onChange={(e) => setDocFormData({ ...docFormData, notes: e.target.value })}
                  placeholder="Additional information about the document..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  📤 Upload document
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowDocumentForm(false);
                    setDocFormData({ carId: '', category: 'other', file: null, notes: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {sortedDocs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No documents attached</h3>
            <p>{docFilterType === 'all' 
              ? 'Use the "➕ Add Document" button to upload files' 
              : 'No documents for this category'
            }</p>
          </div>
        ) : (
          <div className="documents-grid">
            {sortedDocs.map(doc => {
              const fileExt = doc.fileUrl.split('.').pop().toLowerCase();
              const isPDF = fileExt === 'pdf';
              const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt);
              
              return (
                <div key={doc.id} className="document-card">
                  <div className="doc-preview">
                    {isPDF ? (
                      <div className="doc-icon pdf">📄</div>
                    ) : isImage ? (
                      <img src={doc.fileUrl} alt="Document preview" className="doc-image" />
                    ) : (
                      <div className="doc-icon">📎</div>
                    )}
                  </div>
                  <div className="doc-info">
                    <h4>{getServiceName(doc.serviceType)}</h4>
                    <p className="doc-car">
                      🚗 {doc.car?.brand} {doc.car?.model} {doc.car?.year && `(${doc.car.year})`}
                    </p>
                    <p className="doc-date">
                      📅 {new Date(doc.expiryDate).toLocaleDateString('en-GB')}
                    </p>
                    {doc.mileage && (
                      <p className="doc-mileage">
                        🛣️ {doc.mileage.toLocaleString()} km
                      </p>
                    )}
                    {doc.cost > 0 && (
                      <p className="doc-cost">
                        💰 {doc.cost.toFixed(2)} BGN
                      </p>
                    )}
                  </div>
                  <div className="doc-actions">
                    <a 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="doc-view-btn"
                    >
                      👁️ View
                    </a>
                    <a 
                      href={doc.fileUrl} 
                      download
                      className="doc-download-btn"
                    >
                      ⬇️ Download
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.fileUrl)}
                      className="doc-delete-btn"
                      title="Delete document"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-new">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-left">
          <img src={logoUrl} alt="CarGuard logo" className="logo-img" />
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
          <span className="nav-text">Dashboard</span>
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'cars' ? 'active' : ''}`}
          onClick={() => { setActiveTab('cars'); setMobileMenuOpen(false); }}
        >
          <span className="nav-icon">🚘</span>
          <span className="nav-text">My Vehicles</span>
          {cars.length > 0 && <span className="nav-badge">{cars.length}</span>}
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => { setActiveTab('services'); setMobileMenuOpen(false); }}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-text">Services</span>
          {getExpiringServices().length > 0 && (
            <span className="nav-badge warning">{getExpiringServices().length}</span>
          )}
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => { setActiveTab('documents'); setMobileMenuOpen(false); }}
        >
          <span className="nav-icon">📁</span>
          <span className="nav-text">Documents</span>
          {allServices.filter(s => s.fileUrl).length > 0 && (
            <span className="nav-badge">{allServices.filter(s => s.fileUrl).length}</span>
          )}
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </button>
        <div className="mobile-user-info">
          <span>👤 {user?.name}</span>
          <button className="mobile-logout-btn" onClick={handleLogout}>
            🚪 Logout
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
          <img src={logoUrl} alt="CarGuard logo" className="logo-img" />
          <span className="logo-text">CarGuard</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'cars' ? 'active' : ''}`}
            onClick={() => setActiveTab('cars')}
          >
            <span className="nav-icon">🚘</span>
            <span className="nav-text">My Vehicles</span>
            {cars.length > 0 && <span className="nav-badge">{cars.length}</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Services</span>
            {getExpiringServices().length > 0 && (
              <span className="nav-badge warning">{getExpiringServices().length}</span>
            )}
          </button>
          <button 
            className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-text">Documents</span>
            {allServices.filter(s => s.fileUrl).length > 0 && (
              <span className="nav-badge">{allServices.filter(s => s.fileUrl).length}</span>
            )}
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
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
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'cars' && renderCars()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'documents' && renderDocuments()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
};

export default Dashboard;
