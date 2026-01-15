import React, { useState } from 'react';

const ServiceForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    serviceType: 'гражданска',
    expiryDate: ''
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
    onSubmit(formData);
    setFormData({
      serviceType: 'гражданска',
      expiryDate: ''
    });
  };

  return (
    <form className="service-form" onSubmit={handleSubmit}>
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
      <div className="form-buttons">
        <button type="submit" className="submit-btn">Добави</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Отказ</button>
      </div>
    </form>
  );
};

export default ServiceForm;
