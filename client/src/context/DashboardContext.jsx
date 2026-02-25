import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import carsService from '../lib/supabaseCars';
import servicesService from '../lib/supabaseServices';
import { generateCarReport } from '../lib/pdfService';

const DashboardContext = createContext();

const DEFAULT_REMINDER_SETTINGS = {
  maintenance: 30, tax: 30, fire_extinguisher: 30,
  inspection: 30, casco: 30, vignette: 30, civil_liability: 30
};

export const DashboardProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout, updateReminderDays: updateReminderDaysCtx,
    updateReminderEnabled: updateReminderEnabledCtx,
    updateReminderSettings: updateReminderSettingsCtx,
    isInitialized } = useAuth();

  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCarForm, setShowCarForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  const [reminderDays, setReminderDays] = useState(30);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderSettings, setReminderSettings] = useState(DEFAULT_REMINDER_SETTINGS);

  const [showCarPicker, setShowCarPicker] = useState(false);
  const [carPickerMode, setCarPickerMode] = useState(null);
  const [carPickerSelected, setCarPickerSelected] = useState(null);

  // Documents state
  const [docFilterCar, setDocFilterCar] = useState('all');
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docUploadCar, setDocUploadCar] = useState(null);
  const [docUploadFile, setDocUploadFile] = useState(null);
  const [docUploadNote, setDocUploadNote] = useState('');
  const [docUploading, setDocUploading] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (user?.reminderDays) setReminderDays(user.reminderDays);
    if (typeof user?.reminderEnabled === 'boolean') setReminderEnabled(user.reminderEnabled);
    else if (typeof user?.reminder_enabled === 'boolean') setReminderEnabled(user.reminder_enabled);
    if (user?.reminder_settings && Object.keys(user.reminder_settings).length > 0) {
      setReminderSettings({ ...DEFAULT_REMINDER_SETTINGS, ...user.reminder_settings });
    }
    loadCars();
    loadAllServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, user?.reminderDays, user?.reminder_days, user?.reminderEnabled, user?.reminder_enabled, user?.reminder_settings]);

  useEffect(() => {
    if (selectedCar) loadServices(selectedCar.id);
  }, [selectedCar]);

  const loadCars = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;
      const data = await carsService.getAllCars(user.id);
      setCars(data);
      if (data.length > 0 && !selectedCar) setSelectedCar(data[0]);
    } catch (err) {
      console.error('Error loading cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllServices = async () => {
    try {
      if (!user?.id) return;
      const userCars = await carsService.getAllCars(user.id);
      const all = [];
      for (const car of userCars) {
        const s = await servicesService.getServices(car.id);
        all.push(...s);
      }
      setAllServices(all);
    } catch (err) {
      console.error('Error loading all services:', err);
    }
  };

  const loadServices = async (carId) => {
    try {
      const data = await servicesService.getServices(carId);
      setServices(data);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

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

  const handleEditCar = (car) => { setEditingCar(car); setShowCarForm(true); };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await carsService.deleteCar(carId);
      loadCars();
      if (selectedCar?.id === carId) setSelectedCar(null);
    } catch (err) {
      console.error('Error deleting car:', err);
    }
  };

  const handleCarChangeForService = (carId) => {
    const car = cars.find(c => c.id === parseInt(carId));
    if (car) setSelectedCar(car);
  };

  const handleAddService = async (serviceData) => {
    try {
      if (serviceData.file) {
        try {
          const tempService = await servicesService.createService({
            carId: selectedCar.id, userId: user.id,
            serviceType: serviceData.serviceType,
            expiryDate: serviceData.expiryDate,
            cost: serviceData.cost, liters: serviceData.liters,
            pricePerLiter: serviceData.pricePerLiter,
            fuelType: serviceData.fuelType, notes: serviceData.notes,
            mileage: serviceData.mileage
          });
          const fileUrl = await servicesService.uploadFile(serviceData.file, user.id, tempService.id);
          await servicesService.updateService(tempService.id, { fileUrl });
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          alert('Error uploading file. Service saved without file.');
        }
      } else {
        await servicesService.createService({
          carId: selectedCar.id, userId: user.id,
          serviceType: serviceData.serviceType,
          expiryDate: serviceData.expiryDate,
          cost: serviceData.cost, liters: serviceData.liters,
          pricePerLiter: serviceData.pricePerLiter,
          fuelType: serviceData.fuelType, notes: serviceData.notes,
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

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await servicesService.deleteService(serviceId);
      loadServices(selectedCar.id);
      loadAllServices();
    } catch (err) {
      console.error('Error deleting service:', err);
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
      navigate('/dashboard/services');
      setTimeout(() => setShowServiceForm(true), 100);
    } else if (carPickerMode === 'pdf') {
      try {
        await generateCarReport(carPickerSelected, allServices.filter(s => s.carId === carPickerSelected.id));
      } catch (err) {
        alert('Error generating PDF: ' + err.message);
      }
    }
  };

  const handleDocUpload = async () => {
    if (!docUploadFile || !docUploadCar) return;
    setDocUploading(true);
    try {
      const tempService = await servicesService.createService({
        carId: docUploadCar.id, userId: user.id,
        serviceType: 'other',
        expiryDate: new Date().toISOString().split('T')[0],
        cost: 0, notes: docUploadNote || docUploadFile.name,
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

  const handleReminderDaysChange = async (days) => {
    const value = parseInt(days);
    try { await updateReminderDaysCtx(value); setReminderDays(value); }
    catch (err) { console.error(err); alert('Error updating reminders'); }
  };

  const handleReminderEnabledChange = async (enabled) => {
    try { await updateReminderEnabledCtx(enabled); setReminderEnabled(enabled); }
    catch (err) { console.error(err); alert('Error updating reminders'); }
  };

  const handleReminderSettingChange = async (serviceType, days) => {
    const updated = { ...reminderSettings, [serviceType]: parseInt(days) };
    setReminderSettings(updated);
    try { await updateReminderSettingsCtx(updated); }
    catch (err) { console.error('Error saving reminder settings:', err); }
  };

  // Helpers
  const getServiceIcon = (type) => {
    const icons = {
      civil_liability: '🛡️', vignette: '🛣️', inspection: '🔧',
      casco: '💎', tax: '💰', fire_extinguisher: '🔴',
      repair: '🛠️', maintenance: '🛢️', tires: '🛞', refuel: '⛽', other: '📝'
    };
    return icons[type] || '📋';
  };

  const getServiceName = (type) => {
    const names = {
      civil_liability: 'Civil Liability Insurance', vignette: 'Vignette',
      inspection: 'Yearly Inspection', casco: 'Casco Insurance',
      tax: 'Vehicle Tax', fire_extinguisher: 'Fire Extinguisher',
      repair: 'Repair', maintenance: 'Maintenance',
      tires: 'Tire Change', refuel: 'Refuel', other: 'Other'
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

  const isExpiringType = (type) =>
    ['civil_liability', 'vignette', 'inspection', 'casco', 'tax', 'fire_extinguisher', 'maintenance'].includes(type);

  const stats = {
    totalCars: cars.length,
    upcomingServices: allServices.filter(s => {
      if (!isExpiringType(s.serviceType)) return false;
      const status = getServiceStatus(s.expiryDate, s.serviceType);
      return status.status === 'warning' || status.status === 'expired';
    }).length,
    totalServices: allServices.length,
    totalCosts: allServices.reduce((sum, s) => sum + (s.cost || 0), 0)
  };

  return (
    <DashboardContext.Provider value={{
      // state
      cars, selectedCar, setSelectedCar,
      services, allServices, loading,
      showCarForm, setShowCarForm,
      showServiceForm, setShowServiceForm,
      editingCar, setEditingCar,
      reminderDays, reminderEnabled, reminderSettings,
      showCarPicker, setShowCarPicker,
      carPickerMode, carPickerSelected, setCarPickerSelected,
      docFilterCar, setDocFilterCar,
      showDocUpload, setShowDocUpload,
      docUploadCar, setDocUploadCar,
      docUploadFile, setDocUploadFile,
      docUploadNote, setDocUploadNote,
      docUploading,
      // handlers
      handleLogout, handleAddCar, handleEditCar, handleDeleteCar,
      handleCarChangeForService, handleAddService, handleDeleteService,
      openCarPicker, handleCarPickerConfirm, handleDocUpload,
      handleReminderDaysChange, handleReminderEnabledChange, handleReminderSettingChange,
      // helpers
      getServiceIcon, getServiceName, getServiceStatus, isExpiringType, stats,
      // reload
      loadCars, loadAllServices, loadServices,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};
