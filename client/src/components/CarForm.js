import React, { useState, useEffect } from 'react';
import { getBrands, getModels } from '../data/carBrands';
import carsService from '../lib/supabaseCars';
import '../styles/CarForm.css';

const CarForm = ({ onSubmit, onCancel, initialData }) => {
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'vin'
  const [activeTab, setActiveTab] = useState('basic');
  const [vinInput, setVinInput] = useState('');
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState('');
  const [vinData, setVinData] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    vin: '',
    engineType: '',
    horsepower: '',
    transmission: '',
    euroStandard: '',
    mileage: '',
    fuelType: '',
    tireWidth: '',
    tireHeight: '',
    tireDiameter: '',
    tireSeason: '',
    tireBrand: '',
    tireDot: '',
  });
  
  const [availableModels, setAvailableModels] = useState([]);
  const brands = getBrands();

  // Load data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        brand: initialData.brand || '',
        model: initialData.model || '',
        year: initialData.year || new Date().getFullYear(),
        licensePlate: initialData.licensePlate || '',
        vin: initialData.vin || '',
        engineType: initialData.engineType || '',
        horsepower: initialData.horsepower || '',
        transmission: initialData.transmission || '',
        euroStandard: initialData.euroStandard || '',
        mileage: initialData.mileage || '',
        fuelType: initialData.fuelType || '',
        tireWidth: initialData.tireWidth || '',
        tireHeight: initialData.tireHeight || '',
        tireDiameter: initialData.tireDiameter || '',
        tireSeason: initialData.tireSeason || '',
        tireBrand: initialData.tireBrand || '',
        tireDot: initialData.tireDot || '',
      });
      setAvailableModels(getModels(initialData.brand));
      if (initialData.vin) {
        setVinInput(initialData.vin);
      }
    }
  }, [initialData]);

  // VIN decode function
  const handleVinDecode = async () => {
    if (!vinInput || vinInput.length !== 17) {
      setVinError('VIN must be exactly 17 characters');
      return;
    }

    setVinLoading(true);
    setVinError('');
    setVinData(null);

    try {
      const data = await carsService.decodeVin(vinInput);
      
      setVinData(data);
      
      // Find brand in list (case-insensitive)
      let matchedBrand = '';
      if (data.brand) {
        const brandLower = data.brand.toLowerCase();
        matchedBrand = brands.find(b => b.toLowerCase() === brandLower) || '';
      }
      
      // Update models if brand exists
      let matchedModel = '';
      if (matchedBrand) {
        const models = getModels(matchedBrand);
        setAvailableModels(models);
        
        // Find model in list (case-insensitive)
        if (data.model) {
          const modelLower = data.model.toLowerCase();
          matchedModel = models.find(m => m.toLowerCase() === modelLower) || data.model;
        }
      }
      
      // Populate form with VIN data
      setFormData(prev => ({
        ...prev,
        brand: matchedBrand || prev.brand,
        model: matchedModel || prev.model,
        year: data.year || prev.year,
        vin: vinInput,
        engineType: data.engineType || prev.engineType,
        horsepower: data.horsepower || prev.horsepower,
        transmission: data.transmission || prev.transmission,
      }));
      
    } catch (err) {
      setVinError(err.message || 'Error decoding VIN');
    } finally {
      setVinLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'brand') {
      // When brand changes, update models and clear selected model
      setAvailableModels(getModels(value));
      setFormData(prev => ({
        ...prev,
        brand: value,
        model: ''
      }));
    } else {
      let finalValue = value;
      // Handle numeric fields
      if ((name === 'year' || name === 'horsepower' || name === 'mileage' || name.startsWith('tire')) 
           && name !== 'tireBrand' && name !== 'tireSeason' && name !== 'tireDot') {
        const intVal = parseInt(value);
        finalValue = isNaN(intVal) ? '' : intVal;
      }

      setFormData(prev => ({
        ...prev,
        [name]: finalValue
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting form data:", formData);
    onSubmit(formData);
    if (!initialData) {
      // Reset form if used for adding new car
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        vin: '',
        engineType: '',
        horsepower: '',
        transmission: '',
        euroStandard: '',
        mileage: '',
        fuelType: '',
        tireWidth: '',
        tireHeight: '',
        tireDiameter: '',
        tireSeason: '',
        tireBrand: '',
        tireDot: '',
      });
      setAvailableModels([]);
      setActiveTab('basic');
    }
  };

  return (
    <div className="car-form-container">
      {/* Mode selection - manual or VIN */}
      {!initialData && (
        <div className="input-mode-selector">
          <button 
            type="button"
            className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
            onClick={() => setInputMode('manual')}
          >
            ✏️ Manual entry
          </button>
          <button 
            type="button"
            className={`mode-btn ${inputMode === 'vin' ? 'active' : ''}`}
            onClick={() => setInputMode('vin')}
          >
            🔍 By VIN number
          </button>
        </div>
      )}

      {/* VIN section */}
      {inputMode === 'vin' && !initialData && (
        <div className="vin-section">
          <div className="vin-input-group">
            <label>VIN number (17 characters)</label>
            <div className="vin-input-row">
              <input
                type="text"
                value={vinInput}
                onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                placeholder="Enter VIN"
                maxLength={17}
                className="vin-input"
              />
              <button 
                type="button" 
                className="vin-decode-btn"
                onClick={handleVinDecode}
                disabled={vinLoading || vinInput.length !== 17}
              >
                {vinLoading ? '⏳ Loading...' : '🔍 Check'}
              </button>
            </div>
            <div className="vin-counter">{vinInput.length}/17</div>
            {vinError && <div className="vin-error">⚠️ {vinError}</div>}
          </div>

          {vinData && (
            <div className="vin-result">
              {/* Warning for European VIN */}
              {vinData.isEuropean && (
                <div className="vin-warning">
                  ⚠️ <strong>European VIN</strong> - Data may be incomplete. 
                  Please verify and correct the form below.
                </div>
              )}

              {/* Show found information */}
              <div className="vin-found-info">
                <h4>✅ Found information:</h4>
                <div className="vin-found-grid">
                  {vinData.brand && <span><strong>Brand:</strong> {vinData.brand}</span>}
                  {vinData.year && <span><strong>Year:</strong> {vinData.year}</span>}
                  {vinData.plantCountry && <span><strong>Made in:</strong> {vinData.plantCountry}</span>}
                </div>
              </div>

              <p className="vin-hint">💡 The form below is prefilled. Adjust if needed.</p>
            </div>
          )}
        </div>
      )}

      <div className="car-form-tabs">
        <button 
          type="button" 
          className={`form-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          ℹ️ Basic information
        </button>
        <button 
          type="button" 
          className={`form-tab-btn ${activeTab === 'tech' ? 'active' : ''}`}
          onClick={() => setActiveTab('tech')}
        >
          ⚙️ Technical data
        </button>
        <button 
          type="button" 
          className={`form-tab-btn ${activeTab === 'tires' ? 'active' : ''}`}
          onClick={() => setActiveTab('tires')}
        >
          🔘 Tires
        </button>
      </div>

      <form className="car-form" onSubmit={handleSubmit}>
        <div className="form-content">
          {activeTab === 'basic' && (
            <div className="form-section fade-in">
              <div className="form-row">
                <div className="form-group half">
                  <label>Brand *</label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select brand --</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group half">
                  <label>Model *</label>
                  <select
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    disabled={!formData.brand}
                  >
                    <option value="">-- Select model --</option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label>Year *</label>
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
                <div className="form-group half">
                  <label>License plate</label>
                  <input 
                    type="text" 
                    name="licensePlate" 
                    value={formData.licensePlate} 
                    onChange={handleChange}
                    placeholder="CB 1234 AB"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>VIN (Chassis)</label>
                <input 
                  type="text" 
                  name="vin" 
                  value={formData.vin} 
                  onChange={handleChange}
                  placeholder="Enter VIN"
                />
              </div>

              <div className="form-group">
                <label>Mileage (km)</label>
                <input 
                  type="number" 
                  name="mileage" 
                  value={formData.mileage} 
                  onChange={handleChange}
                  placeholder="e.g. 150000"
                />
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="form-section fade-in">
              <div className="form-row">
                <div className="form-group half">
                  <label>Engine type</label>
                  <select name="engineType" value={formData.engineType} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="Benzin">Gasoline</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="LPG">LPG/Gasoline</option>
                    <option value="CNG">CNG/Gasoline</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>Horsepower (HP)</label>
                  <input 
                    type="number" 
                    name="horsepower" 
                    value={formData.horsepower} 
                    onChange={handleChange}
                    placeholder="e.g. 150"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Transmission</label>
                  <select name="transmission" value={formData.transmission} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Semi-Auto">Semi-automatic</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>Euro standard</label>
                  <select name="euroStandard" value={formData.euroStandard} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="Euro 1">Euro 1</option>
                    <option value="Euro 2">Euro 2</option>
                    <option value="Euro 3">Euro 3</option>
                    <option value="Euro 4">Euro 4</option>
                    <option value="Euro 5">Euro 5</option>
                    <option value="Euro 6">Euro 6</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tires' && (
            <div className="form-section fade-in">
              <div className="tire-visual-hint">
                <div className="tire-diagram">
                   <span>{formData.tireWidth || '205'} / {formData.tireHeight || '55'} R{formData.tireDiameter || '16'}</span>
                </div>
                <small className="tire-hint-text">Enter tire sizes</small>
              </div>

              <div className="form-row three-cols">
                <div className="form-group">
                  <label>Width</label>
                  <select name="tireWidth" value={formData.tireWidth} onChange={handleChange}>
                     <option value="">--</option>
                     {[135,145,155,165,175,185,195,205,215,225,235,245,255,265,275,285,295,305,315].map(w => (
                       <option key={w} value={w}>{w}</option>
                     ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Height</label>
                  <select name="tireHeight" value={formData.tireHeight} onChange={handleChange}>
                     <option value="">--</option>
                     {[30,35,40,45,50,55,60,65,70,75,80,85].map(h => (
                       <option key={h} value={h}>{h}</option>
                     ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Diameter (R)</label>
                  <select name="tireDiameter" value={formData.tireDiameter} onChange={handleChange}>
                     <option value="">--</option>
                     {[13,14,15,16,17,18,19,20,21,22].map(d => (
                       <option key={d} value={d}>R{d}</option>
                     ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Season</label>
                  <select name="tireSeason" value={formData.tireSeason} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                    <option value="AllSeasons">All-season</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>DOT</label>
                  <input 
                    type="text" 
                    name="tireDot" 
                    value={formData.tireDot} 
                    onChange={handleChange}
                    placeholder="e.g. 2423"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tire brand</label>
                <input 
                  type="text" 
                  name="tireBrand" 
                  value={formData.tireBrand} 
                  onChange={handleChange}
                  placeholder="e.g. Michelin, Continental..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="submit-btn">{initialData ? 'Save changes' : 'Add vehicle'}</button>
        </div>
      </form>
    </div>
  );
};

export default CarForm;
