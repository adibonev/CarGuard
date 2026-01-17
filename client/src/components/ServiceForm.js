import React, { useState } from 'react';

const ServiceForm = ({ onSubmit, onCancel, cars, selectedCarId, onCarChange }) => {
  const [formData, setFormData] = useState({
    serviceType: 'гражданска',
    expiryDate: '',
    cost: ''
  });

  const serviceOptions = [
    { value: 'гражданска', label: '🛡️ Гражданска отговорност' },
    { value: 'винетка', label: '🛣️ Винетка' },
    { value: 'преглед', label: '🔧 Технически преглед' },
    { value: 'каско', label: '💎 КАСКО' },
    { value: 'данък', label: '💰 Данък' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.expiryDate) {
      alert('Моля, изберете дата на изтичане');
      return;
    }
    if (!selectedCarId) {
      alert('Моля, изберете автомобил');
      return;
    }
    // Convert date to ISO format for API
    const submitData = {
      ...formData,
      expiryDate: new Date(formData.expiryDate).toISOString(),
      cost: parseFloat(formData.cost) || 0
    };
    onSubmit(submitData);
    setFormData({
      serviceType: 'гражданска',
      expiryDate: '',
      cost: ''
    });
  };

  return (
    <form className="service-form" onSubmit={handleSubmit}>
      {cars && cars.length > 0 && (
        <div className="form-group">
          <label>Автомобил</label>
          <select
            value={selectedCarId || ''}
            onChange={(e) => onCarChange && onCarChange(e.target.value)}
            required
          >
            <option value="">-- Избери автомобил --</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.brand} {car.model} ({car.year})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-group">
        <label>Вид услуга</label>
        <select
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
          required
        >
          {serviceOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Дата на изтичане</label>
        <input
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Цена (лв.)</label>
        <input
          type="number"
          name="cost"
          value={formData.cost}
          onChange={handleChange}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </div>
      <div className="form-buttons">
        <button type="submit" className="submit-btn">Добави</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Отказ</button>
      </div>
    </form>
  );
};

export default ServiceForm;
