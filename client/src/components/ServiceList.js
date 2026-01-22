import React from 'react';

const ServiceList = ({ services, onDeleteService }) => {
  const serviceLabels = {
    'гражданска': '🛡️ Гражданска застраховка',
    'винетка': '🛣️ Винетка',
    'преглед': '🔧 Технически преглед',
    'каско': '💎 КАСКО',
    'данък': '💰 Данък',
    'пожарогасител': '🔴 Заверка на пожарогасител',
    'ремонт': '🛠️ Ремонт',
    'обслужване': '🛢️ Обслужване',
    'гуми': '🛞 Добавяне на гуми',
    'зареждане': '⛽ Зареждане',
    'друго': '📝 Друго'
  };

  const isExpiringType = (type) => {
    return ['гражданска', 'винетка', 'преглед', 'каско', 'данък', 'пожарогасител'].includes(type);
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

    if (daysLeft < 0) return 'ИЗТЕКЛО';
    if (daysLeft === 0) return 'ИЗТИЧА ДНЕС';
    if (daysLeft === 1) return 'Утре';
    return `${daysLeft} дни`;
  };

  if (services.length === 0) {
    return <p className="no-data">Нямаш добавени събития</p>;
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
                {isExpiring ? 'Изтича: ' : 'Дата: '}
                {new Date(service.expiryDate).toLocaleDateString('bg-BG')}
              </p>
              {isExpiring && (
                <p className={`status-text status-${getStatusColor(service)}`}>
                  {getStatusText(service)}
                </p>
              )}
              {service.cost > 0 && (
                <p className="service-cost">
                   Цена: {service.cost.toFixed(2)} лв.
                </p>
              )}
            </div>
            <button
              className="delete-btn"
              onClick={() => {
                if (window.confirm('Сигурен ли си?')) {
                  onDeleteService(service._id || service.id);
                }
              }}
            >
              Изтрий
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ServiceList;
