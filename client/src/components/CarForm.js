import React, { useState, useEffect } from 'react';
import { getBrands, getModels } from '../data/carBrands';
import { carsAPI } from '../api';
import '../styles/CarForm.css';

const CarForm = ({ onSubmit, onCancel, initialData }) => {
  const [inputMode, setInputMode] = useState('manual'); // 'manual' или 'vin'
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

  // При редактиране зареди данните
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

  // Функция за декодиране на VIN
  const handleVinDecode = async () => {
    if (!vinInput || vinInput.length !== 17) {
      setVinError('VIN номерът трябва да е точно 17 символа');
      return;
    }

    setVinLoading(true);
    setVinError('');
    setVinData(null);

    try {
      const response = await carsAPI.decodeVin(vinInput);
      const data = response.data;
      
      setVinData(data);
      
      // Намери марката в списъка (case-insensitive)
      let matchedBrand = '';
      if (data.brand) {
        const brandLower = data.brand.toLowerCase();
        matchedBrand = brands.find(b => b.toLowerCase() === brandLower) || '';
      }
      
      // Обнови моделите ако има марка
      let matchedModel = '';
      if (matchedBrand) {
        const models = getModels(matchedBrand);
        setAvailableModels(models);
        
        // Намери модела в списъка (case-insensitive)
        if (data.model) {
          const modelLower = data.model.toLowerCase();
          matchedModel = models.find(m => m.toLowerCase() === modelLower) || data.model;
        }
      }
      
      // Попълни формата с данните от VIN
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
      setVinError(err.response?.data?.error || 'Грешка при декодиране на VIN');
    } finally {
      setVinLoading(false);
    }
  };

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
      {/* Избор на режим - ръчно или VIN */}
      {!initialData && (
        <div className="input-mode-selector">
          <button 
            type="button"
            className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
            onClick={() => setInputMode('manual')}
          >
            ✏️ Ръчно въвеждане
          </button>
          <button 
            type="button"
            className={`mode-btn ${inputMode === 'vin' ? 'active' : ''}`}
            onClick={() => setInputMode('vin')}
          >
            🔍 По VIN номер
          </button>
        </div>
      )}

      {/* VIN секция */}
      {inputMode === 'vin' && !initialData && (
        <div className="vin-section">
          <div className="vin-input-group">
            <label>VIN номер (17 символа)</label>
            <div className="vin-input-row">
              <input
                type="text"
                value={vinInput}
                onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                placeholder="Въведи VIN номер"
                maxLength={17}
                className="vin-input"
              />
              <button 
                type="button" 
                className="vin-decode-btn"
                onClick={handleVinDecode}
                disabled={vinLoading || vinInput.length !== 17}
              >
                {vinLoading ? '⏳ Зареждане...' : '🔍 Провери'}
              </button>
            </div>
            <div className="vin-counter">{vinInput.length}/17</div>
            {vinError && <div className="vin-error">⚠️ {vinError}</div>}
          </div>

          {vinData && (
            <div className="vin-result">
              {/* Предупреждение за европейски VIN */}
              {vinData.isEuropean && (
                <div className="vin-warning">
                  ⚠️ <strong>Европейски VIN</strong> - Данните може да са непълни. 
                  Проверете и коригирайте във формата по-долу.
                </div>
              )}

              {/* Показване на намерена информация */}
              <div className="vin-found-info">
                <h4>✅ Намерена информация:</h4>
                <div className="vin-found-grid">
                  {vinData.brand && <span><strong>Марка:</strong> {vinData.brand}</span>}
                  {vinData.year && <span><strong>Година:</strong> {vinData.year}</span>}
                  {vinData.plantCountry && <span><strong>Произведен в:</strong> {vinData.plantCountry}</span>}
                </div>
              </div>

              <p className="vin-hint">💡 Данните са попълнени във формата по-долу. Коригирай ги ако е нужно.</p>
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
          ℹ️ Основна информация
        </button>
        <button 
          type="button" 
          className={`form-tab-btn ${activeTab === 'tech' ? 'active' : ''}`}
          onClick={() => setActiveTab('tech')}
        >
          ⚙️ Технически данни
        </button>
        <button 
          type="button" 
          className={`form-tab-btn ${activeTab === 'tires' ? 'active' : ''}`}
          onClick={() => setActiveTab('tires')}
        >
          🔘 Гуми
        </button>
      </div>

      <form className="car-form" onSubmit={handleSubmit}>
        <div className="form-content">
          {activeTab === 'basic' && (
            <div className="form-section fade-in">
              <div className="form-row">
                <div className="form-group half">
                  <label>Марка *</label>
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
                <div className="form-group half">
                  <label>Модел *</label>
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
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label>Година *</label>
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
                  <label>Рег. номер</label>
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
                <label>VIN (Рама)</label>
                <input 
                  type="text" 
                  name="vin" 
                  value={formData.vin} 
                  onChange={handleChange}
                  placeholder="Въведи VIN номер"
                />
              </div>

              <div className="form-group">
                <label>Пробег (км)</label>
                <input 
                  type="number" 
                  name="mileage" 
                  value={formData.mileage} 
                  onChange={handleChange}
                  placeholder="пр. 150000"
                />
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="form-section fade-in">
              <div className="form-row">
                <div className="form-group half">
                  <label>Тип двигател</label>
                  <select name="engineType" value={formData.engineType} onChange={handleChange}>
                    <option value="">-- Избери --</option>
                    <option value="Benzin">Бензин</option>
                    <option value="Diesel">Дизел</option>
                    <option value="Electric">Електрически</option>
                    <option value="Hybrid">Хибрид</option>
                    <option value="LPG">Газ/Бензин</option>
                    <option value="CNG">Метан/Бензин</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>Конски сили (к.с.)</label>
                  <input 
                    type="number" 
                    name="horsepower" 
                    value={formData.horsepower} 
                    onChange={handleChange}
                    placeholder="пр. 150"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Скоростна кутия</label>
                  <select name="transmission" value={formData.transmission} onChange={handleChange}>
                    <option value="">-- Избери --</option>
                    <option value="Manual">Ръчна</option>
                    <option value="Automatic">Автоматична</option>
                    <option value="Semi-Auto">Полу-автоматична</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>Евро стандарт</label>
                  <select name="euroStandard" value={formData.euroStandard} onChange={handleChange}>
                    <option value="">-- Избери --</option>
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
                <small className="tire-hint-text">Въведи размерите на гумите</small>
              </div>

              <div className="form-row three-cols">
                <div className="form-group">
                  <label>Широчина</label>
                  <select name="tireWidth" value={formData.tireWidth} onChange={handleChange}>
                     <option value="">--</option>
                     {[135,145,155,165,175,185,195,205,215,225,235,245,255,265,275,285,295,305,315].map(w => (
                       <option key={w} value={w}>{w}</option>
                     ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Височина</label>
                  <select name="tireHeight" value={formData.tireHeight} onChange={handleChange}>
                     <option value="">--</option>
                     {[30,35,40,45,50,55,60,65,70,75,80,85].map(h => (
                       <option key={h} value={h}>{h}</option>
                     ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Диаметър (R)</label>
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
                  <label>Сезон</label>
                  <select name="tireSeason" value={formData.tireSeason} onChange={handleChange}>
                    <option value="">-- Избери --</option>
                    <option value="Summer">Летни</option>
                    <option value="Winter">Зимни</option>
                    <option value="AllSeasons">Всесезонни</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>ДОТ</label>
                  <input 
                    type="text" 
                    name="tireDot" 
                    value={formData.tireDot} 
                    onChange={handleChange}
                    placeholder="пр. 2423"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Марка гуми</label>
                <input 
                  type="text" 
                  name="tireBrand" 
                  value={formData.tireBrand} 
                  onChange={handleChange}
                  placeholder="пр. Michelin, Continental..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>Отказ</button>
          <button type="submit" className="submit-btn">{initialData ? 'Запази промените' : 'Добави автомобил'}</button>
        </div>
      </form>
    </div>
  );
};

export default CarForm;
