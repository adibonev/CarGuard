import React from 'react';

const ServiceList = ({ services, onDeleteService }) => {
  const serviceLabels = {
    'гражданска': '🛡️ Гражданска отговорност',
    'винетка': '🛣️ Винетка',
    'преглед': '🔧 Технически преглед',
    'каско': '💎 КАСКО',
    'данък': '💰 Данък'
  };

  const getStatusColor = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'warning';
    return 'ok';
  };

  const getStatusText = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'ИЗТЕКЛО';
    if (daysLeft === 0) return 'ИЗТИЧА ДНЕС';
    if (daysLeft === 1) return 'Утре';
    return `${daysLeft} дни`;
  };

  if (services.length === 0) {
    return <p className="no-data">Нямаш добавени услуги</p>;
  }

  return (
    <div className="service-list">
      {services.map(service => (
        <div key={service._id} className={`service-item status-${getStatusColor(service.expiryDate)}`}>
          <div className="service-info">
            <h3>{serviceLabels[service.serviceType]}</h3>
            <p className="expiry-date">
              Изтича: {new Date(service.expiryDate).toLocaleDateString('bg-BG')}
            </p>
            <p className={`status-text status-${getStatusColor(service.expiryDate)}`}>
              {getStatusText(service.expiryDate)}
            </p>
          </div>
          <button
            className="delete-btn"
            onClick={() => {
              if (window.confirm('Сигурен ли си?')) {
                onDeleteService(service._id);
              }
            }}
          >
            Изтрий
          </button>
        </div>
      ))}
    </div>
  );
};

export default ServiceList;
