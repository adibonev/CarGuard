import React, { useState, useEffect } from 'react';

const ServiceForm = ({ onSubmit, onCancel, cars, selectedCarId, onCarChange }) => {
  const [formData, setFormData] = useState({
    serviceType: 'repair',
    expiryDate: new Date().toISOString().split('T')[0],
    cost: '',
    notes: '',
    liters: '',
    pricePerLiter: '',
    fuelType: 'Benzin',
    mileage: '',
    file: null
  });

  const serviceOptions = [
    { value: 'repair', label: '🛠️ Repair' },
    { value: 'maintenance', label: '🛢️ Maintenance (Oil/Filters)' },
    { value: 'inspection', label: '🔧 Technical Inspection' },
    { value: 'civil_liability', label: '🛡️ Civil Liability Insurance' },
    { value: 'casco', label: '💎 CASCO' },
    { value: 'vignette', label: '🛣️ Vignette' },
    { value: 'tax', label: '💰 Tax' },
    { value: 'fire_extinguisher', label: '🔴 Fire Extinguisher Check' },
    { value: 'tires', label: '🛞 Tire Change' },
    { value: 'refuel', label: '⛽ Refuel' },
    { value: 'other', label: '📝 Other' }
  ];

  const fuelOptions = [
    { value: 'Benzin', label: 'Gasoline' },
    { value: 'Diesel', label: 'Diesel' },
    { value: 'LPG', label: 'Gas (LPG)' },
    { value: 'Electric', label: 'Electric' },
    { value: 'Methane', label: 'Methane' }
  ];

  // Auto-calculate cost for refueling
  useEffect(() => {
    if (formData.serviceType === 'refuel') {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File is too large. Maximum size: 50MB');
        e.target.value = '';
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file format. Allowed: PDF, JPG, PNG, WEBP');
        e.target.value = '';
        return;
      }
      setFormData(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.expiryDate) {
      alert('Please select a date');
      return;
    }
    if (!selectedCarId) {
      alert('Please select a vehicle');
      return;
    }

    if (formData.serviceType === 'refuel' && (!formData.liters || !formData.fuelType)) {
      alert('Please enter liters and fuel type.');
        return;
    }
    
    // Create submission payload
    const submitData = {
      ...formData,
      expiryDate: new Date(formData.expiryDate).toISOString(),
      cost: parseFloat(formData.cost) || 0,
      liters: parseFloat(formData.liters) || null,
      pricePerLiter: parseFloat(formData.pricePerLiter) || null,
      mileage: parseInt(formData.mileage) || null,
      file: formData.file // Keep the file object
    };

    onSubmit(submitData);
    
    // Reset form
    setFormData({
      serviceType: 'repair',
      expiryDate: new Date().toISOString().split('T')[0],
      cost: '',
      notes: '',
      liters: '',
      pricePerLiter: '',
      fuelType: 'Benzin',
      mileage: '',
      file: null
    });
  };

  return (
    <form className="service-form" onSubmit={handleSubmit}>
      {cars && cars.length > 0 && (
        <div className="form-group">
          <label>Vehicle</label>
          <select
            value={selectedCarId || ''}
            onChange={(e) => onCarChange && onCarChange(e.target.value)}
            required
          >
            <option value="">-- Select vehicle --</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.brand} {car.model} ({car.year})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-group">
        <label>Service type</label>
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
        <label>Date</label>
        <input
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Mileage (km) - optional</label>
        <input
          type="number"
          name="mileage"
          value={formData.mileage}
          onChange={handleChange}
          placeholder="e.g. 125000"
          min="0"
        />
      </div>

      {formData.serviceType === 'refuel' ? (
        <>
            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Liters (L)</label>
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
                    <label>Price per liter (€)</label>
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
                <label>Fuel type</label>
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
                <label>Total price (€)</label>
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
            <label>Price (€)</label>
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

      {(formData.serviceType === 'repair' || formData.serviceType === 'other') && (
         <div className="form-group">
            <label>Description</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={formData.serviceType === 'repair' ? "What was replaced?" : "Description..."}
              rows="3"
            />
         </div>
      )}
      
      {formData.serviceType === 'maintenance' && (
         <div className="form-group">
            <label>Comment (optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notes..."
              rows="2"
            />
         </div>
      )}

      <div className="form-group">
        <label>📎 Attach document (optional)</label>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
        />
        {formData.file && (
          <small style={{ display: 'block', marginTop: '5px', color: '#28a745' }}>
            ✓ Selected: {formData.file.name}
          </small>
        )}
        <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
          Allowed formats: PDF, JPG, PNG, WEBP (max 50MB)
        </small>
      </div>

      <div className="form-buttons">
        <button type="submit" className="submit-btn">Add</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default ServiceForm;
