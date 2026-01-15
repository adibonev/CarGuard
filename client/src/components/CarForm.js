import React, { useState } from 'react';

const CarForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: ''
    });
  };

  return (
    <form className="car-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Марка</label>
        <input
          type="text"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Модел</label>
        <input
          type="text"
          name="model"
          value={formData.model}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Година</label>
        <input
          type="number"
          name="year"
          min="1900"
          max={new Date().getFullYear() + 1}
          value={formData.year}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Рег. табличка (не е задължително)</label>
        <input
          type="text"
          name="licensePlate"
          value={formData.licensePlate}
          onChange={handleChange}
        />
      </div>
      <div className="form-buttons">
        <button type="submit" className="submit-btn">Добави</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Отказ</button>
      </div>
    </form>
  );
};

export default CarForm;
