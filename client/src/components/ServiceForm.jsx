import React, { useState, useEffect, useRef } from 'react';

const SERVICE_OPTIONS = [
  { value: 'repair',            icon: '🛠️', label: 'Repair' },
  { value: 'maintenance',       icon: '🛢️', label: 'Maintenance' },
  { value: 'inspection',        icon: '🔧', label: 'Yearly Inspection' },
  { value: 'civil_liability',   icon: '🛡️', label: 'Civil liability' },
  { value: 'casco',             icon: '💎', label: 'Casco Insurance' },
  { value: 'vignette',          icon: '🛣️', label: 'Vignette' },
  { value: 'tax',               icon: '💰', label: 'Vehicle tax' },
  { value: 'fire_extinguisher', icon: '🔴', label: 'Fire extinguisher' },
  { value: 'tires',             icon: '🛞', label: 'Tires' },
  { value: 'refuel',            icon: '⛽', label: 'Refuel' },
  { value: 'other',             icon: '📝', label: 'Other' },
];

const FUEL_OPTIONS = [
  { value: 'Benzin',   icon: '🔴', label: 'Petrol' },
  { value: 'Diesel',   icon: '⚫', label: 'Diesel' },
  { value: 'LPG',      icon: '🟡', label: 'LPG' },
  { value: 'Electric', icon: '⚡', label: 'Electric' },
  { value: 'Methane',  icon: '🔵', label: 'Methane' },
];

const inputStyle = {
  border: '1.5px solid #e9ecef',
  borderRadius: '10px',
  padding: '0.65rem 1rem',
  fontSize: '0.95rem',
  outline: 'none',
  width: '100%',
  background: '#fff',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.82rem',
  color: '#6c757d',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.4rem',
};

const focusBorder = { borderColor: '#dc3545', boxShadow: '0 0 0 3px rgba(220,53,69,0.12)' };

const FancyInput = ({ label, icon, children, style }) => (
  <div style={{ marginBottom: '1.1rem', ...style }}>
    <label style={labelStyle}>{icon && <span style={{ marginRight: 5 }}>{icon}</span>}{label}</label>
    {children}
  </div>
);

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
    file: null,
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);



  useEffect(() => {
    if (formData.serviceType === 'refuel') {
      const liters = parseFloat(formData.liters);
      const price = parseFloat(formData.pricePerLiter);
      if (!isNaN(liters) && !isNaN(price)) {
        setFormData(prev => ({ ...prev, cost: (liters * price).toFixed(2) }));
      }
    }
  }, [formData.liters, formData.pricePerLiter, formData.serviceType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > 50 * 1024 * 1024) { alert('File too large. Max 50MB.'); return false; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { alert('Invalid format. Allowed: PDF, JPG, PNG, WEBP'); return false; }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (validateFile(file)) setFormData(prev => ({ ...prev, file }));
    else if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (validateFile(file)) setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.expiryDate) { alert('Please select a date'); return; }
    if (!selectedCarId) { alert('Please select a vehicle'); return; }
    if (formData.serviceType === 'refuel' && (!formData.liters || !formData.fuelType)) {
      alert('Please enter liters and fuel type.');
      return;
    }
    onSubmit({
      ...formData,
      expiryDate: new Date(formData.expiryDate).toISOString(),
      cost: parseFloat(formData.cost) || 0,
      liters: parseFloat(formData.liters) || null,
      pricePerLiter: parseFloat(formData.pricePerLiter) || null,
      mileage: parseInt(formData.mileage) || null,
    });
    setFormData({
      serviceType: 'repair',
      expiryDate: new Date().toISOString().split('T')[0],
      cost: '', notes: '', liters: '', pricePerLiter: '',
      fuelType: 'Benzin', mileage: '', file: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Vehicle selector */}
      {cars && cars.length > 0 && (
        <FancyInput label="Vehicle" icon="🚗">
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={selectedCarId || ''}
            onChange={(e) => onCarChange && onCarChange(e.target.value)}
            required
            onFocus={e => Object.assign(e.target.style, focusBorder)}
            onBlur={e => Object.assign(e.target.style, { borderColor: '#e9ecef', boxShadow: 'none' })}
          >
            <option value="">— Select vehicle —</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.brand} {car.model} ({car.year})
              </option>
            ))}
          </select>
        </FancyInput>
      )}

      {/* Service type — visual card grid */}
      <div style={{ marginBottom: '1.4rem' }}>
        <label style={labelStyle}>🔧 Service Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {SERVICE_OPTIONS.map(opt => {
            const active = formData.serviceType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, serviceType: opt.value }))}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  padding: '0.65rem 0.4rem',
                  borderRadius: '12px',
                  border: `2px solid ${active ? '#dc3545' : '#e9ecef'}`,
                  background: active ? '#fff5f5' : '#f8f9fa',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontSize: '0.75rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#dc3545' : '#495057',
                  lineHeight: 1.2,
                  textAlign: 'center',
                  boxShadow: active ? '0 2px 8px rgba(220,53,69,0.18)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>
                  {opt.icon.startsWith('bi-')
                    ? <i className={`bi ${opt.icon}`} style={{ fontSize: '1.4rem' }}></i>
                    : opt.icon}
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date & Mileage */}
      {(() => {
        const hideMileage = ['vignette', 'tax', 'fire_extinguisher', 'refuel'].includes(formData.serviceType);
        return (
          <div style={{ display: 'grid', gridTemplateColumns: hideMileage ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
            <FancyInput label="Date" icon="📅" style={{ marginBottom: 0 }}>
              <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required
                style={inputStyle}
                onFocus={e => Object.assign(e.target.style, focusBorder)}
                onBlur={e => Object.assign(e.target.style, { borderColor: '#e9ecef', boxShadow: 'none' })} />
            </FancyInput>
            {!hideMileage && (
              <FancyInput label="Mileage (km)" icon="🛣️" style={{ marginBottom: 0 }}>
                <input type="number" name="mileage" value={formData.mileage} onChange={handleChange}
                  placeholder="125000" min="0" style={inputStyle}
                  onFocus={e => Object.assign(e.target.style, focusBorder)}
                  onBlur={e => Object.assign(e.target.style, { borderColor: '#e9ecef', boxShadow: 'none' })} />
              </FancyInput>
            )}
          </div>
        );
      })()}

      {/* Refuel fields */}
      {formData.serviceType === 'refuel' ? (
        <>
          <FancyInput label="Fuel Type" icon="⛽">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {FUEL_OPTIONS.map(opt => {
                const active = formData.fuelType === opt.value;
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setFormData(prev => ({ ...prev, fuelType: opt.value }))}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '20px',
                      border: `2px solid ${active ? '#dc3545' : '#e9ecef'}`,
                      background: active ? '#dc3545' : '#f8f9fa',
                      color: active ? '#fff' : '#495057',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.83rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                );
              })}
            </div>
          </FancyInput>
          {formData.fuelType === 'Electric' ? (
            <FancyInput label="Cost kW (€)" icon="⚡" style={{ marginBottom: '1.1rem' }}>
              <input type="number" name="cost" value={formData.cost} onChange={handleChange}
                placeholder="0.00" step="0.01" required
                style={{ ...inputStyle, background: '#fff5f5', fontWeight: 700, color: '#dc3545' }}
                onFocus={e => Object.assign(e.target.style, { ...focusBorder, background: '#fff5f5' })}
                onBlur={e => Object.assign(e.target.style, { borderColor: '#e9ecef', boxShadow: 'none' })} />
            </FancyInput>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
              <FancyInput label="Liters (L)" icon="💧" style={{ marginBottom: 0 }}>
                <input type="number" name="liters" value={formData.liters} onChange={handleChange}
                  placeholder="0.00" step="0.01" style={inputStyle}
                  onFocus={e => Object.assign(e.target.style, focusBorder)}
                  onBlur={e => Object.assign(e.target.style, { borderColor: '#e9ecef', boxShadow: 'none' })} />
              </FancyInput>
              <FancyInput label="Price / L (€)" icon="💶" style={{ marginBottom: 0 }}>
                <input type="number" name="pricePerLiter" value={formData.pricePerLiter} onChange={handleChange}
                  placeholder="0.00" step="0.01" style={inputStyle}
                  onFocus={e => Object.assign(e.target.style, focusBorder)}
                  onBlur={e => Object.assign(e.target.style, { borderColor: '#e9ecef', boxShadow: 'none' })} />
              </FancyInput>
              <FancyInput label="Total (€)" icon="🧾" style={{ marginBottom: 0 }}>
                <input type="number" name="cost" value={formData.cost} onChange={handleChange}
                  placeholder="0.00" step="0.01" required
                  style={{ ...inputStyle, background: '#fff5f5', fontWeight: 700, color: '#dc3545' }}
                  onFocus={e => Object.assign(e.target.style, { ...focusBorder, background: '#fff5f5' })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: '#e9ecef', boxShadow: 'none' })} />
              </FancyInput>
            </div>
          )}
        </>
      ) : (
        <FancyInput label="Cost (€)" icon="💶">
          <input type="number" name="cost" value={formData.cost} onChange={handleChange}
            placeholder="0.00" min="0" step="0.01" style={inputStyle}
            onFocus={e => Object.assign(e.target.style, focusBorder)}
            onBlur={e => Object.assign(e.target.style, { borderColor: '#e9ecef', boxShadow: 'none' })} />
        </FancyInput>
      )}

      {/* Notes */}
      {['repair', 'other', 'maintenance'].includes(formData.serviceType) && (
        <FancyInput
          label={formData.serviceType === 'repair' ? 'Repair description' : 'Notes'}
          icon="📋"
        >
          <textarea name="notes" value={formData.notes} onChange={handleChange}
            placeholder={formData.serviceType === 'repair' ? 'What was replaced/repaired?' : 'Notes...'}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
            onFocus={e => Object.assign(e.target.style, { ...focusBorder, resize: 'vertical', minHeight: '80px' })}
            onBlur={e => Object.assign(e.target.style, { borderColor: '#e9ecef', boxShadow: 'none', resize: 'vertical', minHeight: '80px' })}
          />
        </FancyInput>
      )}

      {/* File upload — drag & drop */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={labelStyle}>
          Attach document{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#adb5bd' }}>– optional</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? '#dc3545' : formData.file ? '#28a745' : '#dee2e6'}`,
            borderRadius: '12px',
            padding: '1.2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#fff5f5' : formData.file ? '#f0fff4' : '#fafafa',
            transition: 'all 0.2s',
          }}
        >
          {formData.file ? (
            <div>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <div style={{ fontWeight: 600, color: '#198754', marginTop: '0.3rem' }}>{formData.file.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#6c757d' }}>({(formData.file.size / 1024).toFixed(0)} KB) — Click to change</div>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: '1.8rem' }}>📂</span>
              <div style={{ fontWeight: 600, color: '#495057', marginTop: '0.3rem' }}>Drag file here or click</div>
              <div style={{ fontSize: '0.78rem', color: '#adb5bd', marginTop: '0.2rem' }}>PDF, JPG, PNG, WEBP · max 50MB</div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '10px',
            border: '1.5px solid #dee2e6',
            background: '#fff',
            color: '#6c757d',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.92rem',
          }}
          onMouseEnter={e => e.target.style.borderColor = '#adb5bd'}
          onMouseLeave={e => e.target.style.borderColor = '#dee2e6'}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: '0.6rem 1.8rem',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #dc3545, #c82333)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.92rem',
            boxShadow: '0 4px 12px rgba(220,53,69,0.3)',
          }}
          onMouseEnter={e => e.target.style.boxShadow = '0 6px 16px rgba(220,53,69,0.45)'}
          onMouseLeave={e => e.target.style.boxShadow = '0 4px 12px rgba(220,53,69,0.3)'}
        >
          ➕ Add Service
        </button>
      </div>
    </form>
  );
};

export default ServiceForm;

