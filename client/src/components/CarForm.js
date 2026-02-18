import React, { useState, useEffect } from 'react';
import { getBrands, getModels } from '../data/carBrands';
import carsService from '../lib/supabaseCars';
import '../styles/CarForm.css';
import { Button, Form, Row, Col, Nav, Tabs, Tab, Spinner, Alert } from 'react-bootstrap';

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
    <>
      {/* Mode selection - manual or VIN */}
      {!initialData && (
        <Nav variant="pills" activeKey={inputMode} onSelect={(k) => setInputMode(k)} className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="manual">✏️ Manual entry</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="vin">🔍 By VIN number</Nav.Link>
          </Nav.Item>
        </Nav>
      )}

      {/* VIN section */}
      {inputMode === 'vin' && !initialData && (
        <div className="vin-section mb-3">
          <Form.Group>
            <Form.Label>VIN number (17 characters)</Form.Label>
            <Row>
              <Col>
                <Form.Control
                  type="text"
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                  placeholder="Enter VIN"
                  maxLength={17}
                />
                <Form.Text className="text-muted">{vinInput.length}/17</Form.Text>
              </Col>
              <Col xs="auto">
                <Button 
                  variant="primary"
                  onClick={handleVinDecode}
                  disabled={vinLoading || vinInput.length !== 17}
                >
                  {vinLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Loading...</> : '🔍 Check'}
                </Button>
              </Col>
            </Row>
          </Form.Group>
          {vinError && <Alert variant="danger" className="mt-2">⚠️ {vinError}</Alert>}

          {vinData && (
            <div className="vin-result mt-3">
              {vinData.isEuropean && (
                <Alert variant="warning">
                  ⚠️ <strong>European VIN</strong> - Data may be incomplete. 
                  Please verify and correct the form below.
                </Alert>
              )}
              <div className="vin-found-info">
                <h4>✅ Found information:</h4>
                <div className="vin-found-grid">
                  {vinData.brand && <span><strong>Brand:</strong> {vinData.brand}</span>}
                  {vinData.year && <span><strong>Year:</strong> {vinData.year}</span>}
                  {vinData.plantCountry && <span><strong>Made in:</strong> {vinData.plantCountry}</span>}
                </div>
              </div>
              <p className="vin-hint mt-2">💡 The form below is prefilled. Adjust if needed.</p>
            </div>
          )}
        </div>
      )}

      <Form onSubmit={handleSubmit}>
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="car-form-tabs" className="mb-3" fill>
          <Tab eventKey="basic" title="ℹ️ Basic information">
            <div className="form-section">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Brand *</Form.Label>
                    <Form.Select
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select brand --</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Model *</Form.Label>
                    <Form.Select
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
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Year *</Form.Label>
                    <Form.Control
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>License Plate</Form.Label>
                    <Form.Control
                      type="text"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>VIN (Chassis)</Form.Label>
                <Form.Control
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  maxLength={17}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mileage (km)</Form.Label>
                <Form.Control
                  type="number"
                  name="mileage"
                  placeholder="e.g. 150000"
                  value={formData.mileage}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </Tab>
          <Tab eventKey="tech" title="⚙️ Technical data">
            <div className="form-section">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Engine Type</Form.Label>
                    <Form.Control
                      type="text"
                      name="engineType"
                      value={formData.engineType}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Horsepower</Form.Label>
                    <Form.Control
                      type="number"
                      name="horsepower"
                      value={formData.horsepower}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Transmission</Form.Label>
                    <Form.Select
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleChange}
                    >
                      <option value="">-- Select --</option>
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fuel Type</Form.Label>
                    <Form.Select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                    >
                      <option value="">-- Select --</option>
                      <option value="Gasoline">Gasoline</option>
                      <option value="Diesel">Diesel</option>
                      <option value="LPG">LPG</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Euro Standard</Form.Label>
                <Form.Select
                  name="euroStandard"
                  value={formData.euroStandard}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  <option value="EURO 1">EURO 1</option>
                  <option value="EURO 2">EURO 2</option>
                  <option value="EURO 3">EURO 3</option>
                  <option value="EURO 4">EURO 4</option>
                  <option value="EURO 5">EURO 5</option>
                  <option value="EURO 6">EURO 6</option>
                </Form.Select>
              </Form.Group>
            </div>
          </Tab>
          <Tab eventKey="tires" title="🔘 Tires">
            <div className="form-section">
              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Width</Form.Label>
                    <Form.Control type="number" name="tireWidth" value={formData.tireWidth} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Height</Form.Label>
                    <Form.Control type="number" name="tireHeight" value={formData.tireHeight} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Diameter</Form.Label>
                    <Form.Control type="number" name="tireDiameter" value={formData.tireDiameter} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Season</Form.Label>
                <Form.Select name="tireSeason" value={formData.tireSeason} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="Summer">Summer</option>
                  <option value="Winter">Winter</option>
                  <option value="All-Season">All-Season</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tire Brand</Form.Label>
                <Form.Control type="text" name="tireBrand" value={formData.tireBrand} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>DOT</Form.Label>
                <Form.Control type="text" name="tireDot" value={formData.tireDot} onChange={handleChange} />
              </Form.Group>
            </div>
          </Tab>
        </Tabs>

        <div className="d-flex justify-content-end mt-4">
          <Button variant="secondary" onClick={onCancel} className="me-2">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initialData ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </div>
      </Form>
    </>
  );
};

export default CarForm;
