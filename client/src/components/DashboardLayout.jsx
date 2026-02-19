import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardProvider, useDashboard } from '../context/DashboardContext';
import CarForm from './CarForm';
import ServiceForm from './ServiceForm';
import { getBrandLogo } from '../data/brandLogos';
import '../styles/Dashboard.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: 'red', fontFamily: 'monospace', background: '#fff1f1', minHeight: '100vh' }}>
          <h2>🚨 Dashboard Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardModals = () => {
  const {
    cars, selectedCar, setSelectedCar,
    showCarForm, setShowCarForm,
    showServiceForm, setShowServiceForm,
    editingCar, setEditingCar,
    showCarPicker, setShowCarPicker,
    carPickerMode, carPickerSelected, setCarPickerSelected,
    handleAddCar, handleAddService, handleCarPickerConfirm,
  } = useDashboard();

  return (
    <>
      {showCarForm && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCarForm(false); setEditingCar(null); }}></button>
              </div>
              <div className="modal-body">
                <CarForm onSubmit={handleAddCar} onCancel={() => { setShowCarForm(false); setEditingCar(null); }} initialData={editingCar} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showServiceForm && selectedCar && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Service for {selectedCar.brand} {selectedCar.model}</h5>
                <button type="button" className="btn-close" onClick={() => setShowServiceForm(false)}></button>
              </div>
              <div className="modal-body">
                <ServiceForm selectedCarId={selectedCar.id} onSubmit={handleAddService} onCancel={() => setShowServiceForm(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showCarPicker && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCarPicker(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', color: '#fff', border: 'none' }}>
                <h5 className="modal-title fw-bold">
                  {carPickerMode === 'service' ? '🔧 Select vehicle for service' : '📄 Select vehicle for report'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCarPicker(false)}></button>
              </div>
              <div className="modal-body p-3">
                <div className="d-flex flex-column gap-2">
                  {cars.map(car => (
                    <div key={car.id} onClick={() => setCarPickerSelected(car)} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.85rem 1rem', borderRadius: '12px', cursor: 'pointer',
                      border: `2px solid ${carPickerSelected?.id === car.id ? '#dc3545' : '#e9ecef'}`,
                      background: carPickerSelected?.id === car.id ? '#fff5f5' : '#f8f9fa',
                      transition: 'all 0.15s'
                    }}>
                      {getBrandLogo(car.brand)
                        ? <img src={getBrandLogo(car.brand)} alt={car.brand} style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
                        : <i className="bi bi-car-front-fill" style={{ fontSize: '1.8rem', color: '#6c757d' }}></i>
                      }
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#1a1a1a' }}>{car.brand} {car.model}</div>
                        <div style={{ fontSize: '0.82rem', color: '#6c757d' }}>{car.year} · {car.licensePlate}</div>
                      </div>
                      {carPickerSelected?.id === car.id && (
                        <i className="bi bi-check-circle-fill" style={{ color: '#dc3545', fontSize: '1.2rem' }}></i>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer" style={{ border: 'none' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowCarPicker(false)}>Cancel</button>
                <button className="btn btn-danger" disabled={!carPickerSelected} onClick={handleCarPickerConfirm}>
                  {carPickerMode === 'service' ? '➕ Add Service' : '📄 Generate Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DashboardNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { to: '.', label: 'Overview', icon: 'bi-speedometer2', end: true },
    { to: 'vehicles', label: 'My Vehicles', icon: 'bi-car-front' },
    { to: 'services', label: 'Services', icon: 'bi-wrench' },
    { to: 'documents', label: 'Documents', icon: 'bi-folder' },
    { to: 'settings', label: 'Settings', icon: 'bi-gear' },
  ];

  return (
    <>
      <nav className="navbar navbar-dark sticky-top" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', padding: '1rem 2rem' }}>
        <div className="container-fluid">
          <div className="navbar-brand d-flex align-items-center gap-2 mb-0">
            <span style={{ fontSize: '24px', fontWeight: '700' }}>CarGuard</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50 d-none d-md-inline">{user?.email}</span>
            <button className="btn btn-danger rounded-pill px-4" onClick={handleLogout} style={{ fontWeight: '700' }}>
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop tab navigation */}
      <div className="tab-navigation">
        <div className="container-fluid">
          <div className="nav-tabs-custom">
            {navLinks.map(({ to, label, icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => `tab-btn${isActive ? ' active' : ''}`}
              >
                <i className={`bi ${icon}`}></i>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="mobile-bottom-nav">
        {navLinks.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <i className={`bi ${icon}`}></i>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

const DashboardLayoutInner = () => {
  const { loading } = useDashboard();
  const location = useLocation();

  if (loading) {
    return (
      <div className="dashboard-staging">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-staging">
        <DashboardNav />
        {/* DEBUG: remove after confirming routing works */}
        <div style={{ background: '#ffe0e0', padding: '8px 16px', fontSize: '14px', fontFamily: 'monospace' }}>
          DEBUG Route: <strong>{location.pathname}</strong>
        </div>
        <div className="dashboard-container">
          <Outlet />
        </div>
        <DashboardModals />
      </div>
    </>
  );
};

const DashboardLayout = () => (
  <ErrorBoundary>
    <DashboardProvider>
      <DashboardLayoutInner />
    </DashboardProvider>
  </ErrorBoundary>
);

export default DashboardLayout;
