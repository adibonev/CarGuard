import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getBrandLogo } from '../data/brandLogos';

const Services = () => {
  const {
    cars, selectedCar,
    services, setShowServiceForm,
    handleCarChangeForService, handleDeleteService,
    isExpiringType, getServiceStatus, getServiceIcon, getServiceName,
  } = useDashboard();

  return (
    <div className="tab-content-staging">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h3 mb-0">🔧 Services</h2>
        <button className="btn btn-danger" onClick={() => setShowServiceForm(true)} disabled={!selectedCar}>
          ➕ Add Service
        </button>
      </div>

      {!selectedCar ? (
        <div className="alert alert-info">Please select a vehicle first from <a href="/dashboard/vehicles">My Vehicles</a></div>
      ) : (
        <>
          <div className="d-flex align-items-center gap-3 mb-4 p-3" style={{ background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
            {getBrandLogo(selectedCar.brand) && (
              <img src={getBrandLogo(selectedCar.brand)} alt={selectedCar.brand} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{selectedCar.brand} {selectedCar.model}</div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>{selectedCar.licensePlate}</div>
            </div>
            <select className="form-select" style={{ width: 'auto' }} value={selectedCar?.id || ''} onChange={(e) => handleCarChangeForService(e.target.value)}>
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
                    const status = isExpiringType(service.serviceType)
                      ? getServiceStatus(service.expiryDate, service.serviceType)
                      : null;
                    return (
                      <div key={service.id} className={`list-group-item ${status ? `list-group-item-${status.status === 'expired' ? 'danger' : status.status === 'warning' ? 'warning' : 'success'}` : ''}`}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{getServiceIcon(service.serviceType)} {getServiceName(service.serviceType)}</h6>
                            <p className="mb-1 small">{isExpiringType(service.serviceType) ? 'Expires:' : 'Date:'} {new Date(service.expiryDate).toLocaleDateString('en-US')}</p>
                            {service.cost > 0 && <p className="mb-0 small">Cost: {service.cost} €</p>}
                            {service.notes && <p className="mb-0 small text-muted">{service.notes}</p>}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {status && (
                              <span className={`badge bg-${status.status === 'expired' ? 'danger' : status.status === 'warning' ? 'warning' : 'success'}`}>
                                {status.text}
                              </span>
                            )}
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteService(service.id)}>Delete</button>
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
  );
};

export default Services;
