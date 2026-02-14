import React from 'react';

const ServiceList = ({ services, onDeleteService }) => {
  const serviceLabels = {
    'civil_liability': '🛡️ Civil Liability Insurance',
    'vignette': '🛣️ Vignette',
    'inspection': '🔧 Technical Inspection',
    'casco': '💎 CASCO',
    'tax': '💰 Tax',
    'fire_extinguisher': '🔴 Fire Extinguisher Check',
    'repair': '🛠️ Repair',
    'maintenance': '🛢️ Maintenance',
    'tires': '🛞 Tire Change',
    'refuel': '⛽ Refuel',
    'other': '📝 Other'
  };

  const isExpiringType = (type) => {
    return ['civil_liability', 'vignette', 'inspection', 'casco', 'tax', 'fire_extinguisher'].includes(type);
  };

  const getStatusColor = (service) => {
    if (!isExpiringType(service.serviceType)) return 'neutral';
    
    const today = new Date();
    const expiry = new Date(service.expiryDate);
    const daysLeft = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'warning';
    return 'ok';
  };

  const getStatusText = (service) => {
    if (!isExpiringType(service.serviceType)) return '';

    const today = new Date();
    const expiry = new Date(service.expiryDate);
    const daysLeft = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'EXPIRED';
    if (daysLeft === 0) return 'EXPIRES TODAY';
    if (daysLeft === 1) return 'Tomorrow';
    return `${daysLeft} days`;
  };

  if (services.length === 0) {
    return <p className="no-data">No services added</p>;
  }

  return (
    <div className="service-list">
      {services.map(service => {
        const isExpiring = isExpiringType(service.serviceType);
        return (
          <div key={service._id || service.id} className={`service-item status-${getStatusColor(service)}`}>
            <div className="service-info">
              <h3>{serviceLabels[service.serviceType] || service.serviceType}</h3>
              <p className="expiry-date">
                {isExpiring ? 'Expires: ' : 'Date: '}
                {new Date(service.expiryDate).toLocaleDateString('en-GB')}
              </p>
              {isExpiring && (
                <p className={`status-text status-${getStatusColor(service)}`}>
                  {getStatusText(service)}
                </p>
              )}
              {service.cost > 0 && (
                 <p className="service-cost">
                   Cost: {service.cost.toFixed(2)} €
                 </p>
              )}
            </div>
            <button
              className="delete-btn"
              onClick={() => {
                if (window.confirm('Are you sure?')) {
                  onDeleteService(service._id || service.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ServiceList;
