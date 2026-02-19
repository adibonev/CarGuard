import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { getBrandLogo } from '../data/brandLogos';
import { FaBarcode, FaHashtag } from 'react-icons/fa';

const Vehicles = () => {
  const {
    cars, selectedCar, setSelectedCar,
    services, setShowCarForm,
    handleEditCar, handleDeleteCar,
    isExpiringType, getServiceStatus, getServiceIcon, getServiceName,
  } = useDashboard();

  return (
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
                <div
                  className={`card car-card ${selectedCar?.id === car.id ? 'border-danger' : ''}`}
                  onClick={() => setSelectedCar(car)}
                  style={{ cursor: 'pointer', borderWidth: selectedCar?.id === car.id ? '2px' : '1px' }}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-3">
                        {getBrandLogo(car.brand) && (
                          <img src={getBrandLogo(car.brand)} alt={car.brand} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                        )}
                        <div>
                          <h5 className="mb-0">{car.brand} {car.model}</h5>
                          <p className="mb-0 small text-muted">Year: {car.year}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-2"><FaHashtag className="me-2" /><strong>Plate:</strong> {car.licensePlate}</div>
                    {car.vin && <div className="mb-2"><FaBarcode className="me-2" /><strong>VIN:</strong> {car.vin}</div>}
                    <div className="d-flex gap-2 mt-3">
                      <button className="btn btn-sm btn-outline-primary" onClick={(e) => { e.stopPropagation(); handleEditCar(car); }}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteCar(car.id); }}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Car Detail Panel */}
          {selectedCar && (
            <div style={{ marginTop: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e9ecef', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {getBrandLogo(selectedCar.brand) && (
                  <img src={getBrandLogo(selectedCar.brand)} alt={selectedCar.brand} style={{ width: '48px', height: '48px', objectFit: 'contain', background: '#fff', borderRadius: '8px', padding: '4px' }} />
                )}
                <div style={{ color: '#fff' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{selectedCar.brand} {selectedCar.model}</div>
                  <div style={{ opacity: 0.85, fontSize: '0.88rem' }}>{selectedCar.year} · {selectedCar.licensePlate}</div>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h6 style={{ fontWeight: 700, color: '#dc3545', marginBottom: '1rem' }}><i className="bi bi-info-circle me-2"></i>Basic Info</h6>
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
                      <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: '2px' }}><i className={`bi ${field.icon} me-1`}></i>{field.label}</div>
                        <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{field.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {(selectedCar.tireWidth || selectedCar.tireBrand || selectedCar.tireSeason) && (
                  <>
                    <h6 style={{ fontWeight: 700, color: '#dc3545', marginBottom: '1rem' }}><i className="bi bi-circle me-2"></i>Tires</h6>
                    <div className="row g-3 mb-4">
                      {[
                        { icon: 'bi-arrows-expand', label: 'Size', value: [selectedCar.tireWidth, selectedCar.tireHeight, selectedCar.tireDiameter].filter(Boolean).join('/') || null },
                        { icon: 'bi-tag', label: 'Tire Brand', value: selectedCar.tireBrand },
                        { icon: 'bi-thermometer-half', label: 'Season', value: selectedCar.tireSeason },
                        { icon: 'bi-calendar3', label: 'DOT', value: selectedCar.tireDot },
                      ].filter(f => f.value).map((field, i) => (
                        <div key={i} className="col-6 col-md-3">
                          <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                            <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: '2px' }}><i className={`bi ${field.icon} me-1`}></i>{field.label}</div>
                            <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{field.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <h6 style={{ fontWeight: 700, color: '#dc3545', marginBottom: '1rem' }}><i className="bi bi-wrench me-2"></i>Services</h6>
                {services.length === 0 ? (
                  <div style={{ color: '#6c757d', padding: '1rem 0' }}>No services added</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {services.map(service => {
                      const status = isExpiringType(service.serviceType) ? getServiceStatus(service.expiryDate, service.serviceType) : null;
                      const statusColor = status?.status === 'expired' ? '#dc3545' : status?.status === 'warning' ? '#fd7e14' : '#198754';
                      return (
                        <div key={service.id} style={{ background: '#f8f9fa', borderRadius: '10px', padding: '0.75rem 1rem', borderLeft: `4px solid ${status ? statusColor : '#dee2e6'}` }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div style={{ fontWeight: 600 }}>{getServiceIcon(service.serviceType)} {getServiceName(service.serviceType)}</div>
                              <div style={{ fontSize: '0.82rem', color: '#6c757d' }}>
                                {service.expiryDate && <span>{isExpiringType(service.serviceType) ? 'Expires:' : 'Date:'} {new Date(service.expiryDate).toLocaleDateString('en-US')}</span>}
                                {service.cost > 0 && <span className="ms-3">💰 {service.cost} €</span>}
                                {service.mileage > 0 && <span className="ms-3">🛣️ {Number(service.mileage).toLocaleString()} km</span>}
                              </div>
                              {service.notes && <div style={{ fontSize: '0.8rem', color: '#495057', marginTop: '2px' }}>{service.notes}</div>}
                            </div>
                            {status && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColor, whiteSpace: 'nowrap' }}>{status.text}</span>}
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
  );
};

export default Vehicles;
