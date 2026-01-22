import React, { useState, useEffect } from 'react';

const ServiceForm = ({ onSubmit, onCancel, cars, selectedCarId, onCarChange }) => {
  const [formData, setFormData] = useState({
    serviceType: 'ремонт',
    expiryDate: new Date().toISOString().split('T')[0],
    cost: '',
    notes: '',
    liters: '',
    pricePerLiter: '',
    fuelType: 'Benzin'
  });

  const serviceOptions = [
    { value: 'ремонт', label: '🛠️ Ремонт' },
    { value: 'обслужване', label: '🛢️ Обслужване (Масло/Филтри)' },
    { value: 'преглед', label: '🔧 Технически преглед' },
    { value: 'гражданска', label: '🛡️ Гражданска застраховка' },
    { value: 'каско', label: '💎 КАСКО' },
    { value: 'винетка', label: '🛣️ Винетка' },
    { value: 'данък', label: '💰 Данък' },
    { value: 'пожарогасител', label: '🔴 Заверка на пожарогасител' },
    { value: 'гуми', label: '🍩 Добавяне на гуми' },
    { value: 'зареждане', label: '⛽ Зареждане' },
    { value: 'друго', label: '📝 Друго' }
  ];

  const fuelOptions = [
    { value: 'Benzin', label: 'Бензин' },
    { value: 'Diesel', label: 'Дизел' },
    { value: 'LPG', label: 'Газ (LPG)' },
    { value: 'Electric', label: 'Електричество' },
    { value: 'Methane', label: 'Метан' }
  ];

  // Auto-calculate cost for refueling
  useEffect(() => {
    if (formData.serviceType === 'зареждане') {
      const liters = parseFloat(formData.liters);
      const price = parseFloat(formData.pricePerLiter);
      if (!isNaN(liters) && !isNaN(price)) {
        setFormData(prev => ({
          ...prev,
          cost: (liters * price).toFixed(2)
        }));
      }
    }
  }, [formData.liters, formData.pricePerLiter, formData.serviceType]);

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
      alert('Моля, изберете дата');
      return;
    }
    if (!selectedCarId) {
      alert('Моля, изберете автомобил');
      return;
    }

    if (formData.serviceType === 'зареждане' && (!formData.liters || !formData.fuelType)) {
        alert('Моля попълнете литри и вид гориво.');
        return;
    }
    
    // Create submission payload
    const submitData = {
      ...formData,
      expiryDate: new Date(formData.expiryDate).toISOString(),
      cost: parseFloat(formData.cost) || 0,
      liters: parseFloat(formData.liters) || null,
      pricePerLiter: parseFloat(formData.pricePerLiter) || null
    };

    onSubmit(submitData);
    
    // Reset form
    setFormData({
      serviceType: 'ремонт',
      expiryDate: new Date().toISOString().split('T')[0],
      cost: '',
      notes: '',
      liters: '',
      pricePerLiter: '',
      fuelType: 'Benzin'
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
        <label>Вид събитие</label>
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
        <label>Дата</label>
        <input
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          required
        />
      </div>

      {formData.serviceType === 'зареждане' ? (
        <>
            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Литри (L)</label>
                    <input
                    type="number"
                    name="liters"
                    value={formData.liters}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Цена/литър (лв.)</label>
                    <input
                    type="number"
                    name="pricePerLiter"
                    value={formData.pricePerLiter}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    />
                </div>
            </div>
            <div className="form-group">
                <label>Вид гориво</label>
                <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                >
                    {fuelOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
             <div className="form-group">
                <label>Крайна цена (лв.)</label>
                <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                required
                />
            </div>
        </>
      ) : (
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
      )}

      {(formData.serviceType === 'ремонт' || formData.serviceType === 'друго') && (
         <div className="form-group">
            <label>Описание</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={formData.serviceType === 'ремонт' ? "Какво е сменено?" : "Описание..."}
              rows="3"
            />
         </div>
      )}
      
      {formData.serviceType === 'обслужване' && (
         <div className="form-group">
            <label>Коментар (незадължително)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Бележки..."
              rows="2"
            />
         </div>
      )}

      <div className="form-buttons">
        <button type="submit" className="submit-btn">Добави</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Отказ</button>
      </div>
    </form>
  );
};

export default ServiceForm;
