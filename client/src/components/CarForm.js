import React, { useState, useEffect } from 'react';
import { getBrands, getModels } from '../data/carBrands';

const CarForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear()
  });
  
  const [availableModels, setAvailableModels] = useState([]);
  const brands = getBrands();

  // При редактиране зареди данните
  useEffect(() => {
    if (initialData) {
      setFormData({
        brand: initialData.brand || '',
        model: initialData.model || '',
        year: initialData.year || new Date().getFullYear()
      });
      setAvailableModels(getModels(initialData.brand));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'brand') {
      // Когато се смени марката, обнови моделите и изчисти избрания модел
      setAvailableModels(getModels(value));
      setFormData(prev => ({
        ...prev,
        brand: value,
        model: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'year' ? parseInt(value) : value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    if (!initialData) {
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear()
      });
      setAvailableModels([]);
    }
  };

  return (
    <form className="car-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Марка</label>
        <select
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          required
        >
          <option value="">-- Избери марка --</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Модел</label>
        <select
          name="model"
          value={formData.model}
          onChange={handleChange}
          required
          disabled={!formData.brand}
        >
          <option value="">-- Избери модел --</option>
          {availableModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Година</label>
        <select
          name="year"
          value={formData.year}
          onChange={handleChange}
          required
        >
          {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div className="form-buttons">
        <button type="submit" className="submit-btn">
          {initialData ? 'Запази промените' : 'Добави'}
        </button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Отказ</button>
      </div>
    </form>
  );
};

export default CarForm;
