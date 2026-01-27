const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Get models from request context
const getModels = (req) => req.app.locals.models;

// Decode VIN using NHTSA API (безплатен API)
router.get('/decode-vin/:vin', auth, async (req, res) => {
  try {
    const { vin } = req.params;
    
    // Валидация на VIN (17 символа)
    if (!vin || vin.length !== 17) {
      return res.status(400).json({ error: 'VIN номерът трябва да е 17 символа' });
    }

    console.log('Декодиране на VIN:', vin);

    // Проверка дали е европейски VIN (започва с W, S, V, Z, T, Y, L, etc.)
    const europeanPrefixes = ['W', 'S', 'V', 'Z', 'T', 'Y', 'L', 'N', 'U'];
    const isEuropean = europeanPrefixes.includes(vin.charAt(0));

    // Използваме NHTSA Vehicle API (безплатен, без ключ)
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
    const data = await response.json();

    if (!data.Results) {
      return res.status(404).json({ error: 'Не е намерена информация за този VIN' });
    }

    const getValueByName = (name) => {
      const result = data.Results.find(r => r.Variable === name);
      return result?.Value || null;
    };

    // Декодиране на година от 10-ти символ за европейски VIN
    const yearChar = vin.charAt(9);
    const vinYear = decodeYearFromVin(yearChar);

    // Mapping на данните
    const carData = {
      brand: getValueByName('Make') || '',
      model: getValueByName('Model') || '',
      // За европейски коли използвай декодираната година от VIN
      year: isEuropean ? vinYear : (parseInt(getValueByName('Model Year')) || vinYear),
      engineType: mapFuelType(getValueByName('Fuel Type - Primary')),
      horsepower: parseFloat(getValueByName('Engine Brake (hp) From')) || null,
      transmission: mapTransmission(getValueByName('Transmission Style')),
      displacement: getValueByName('Displacement (L)'),
      cylinders: getValueByName('Engine Number of Cylinders'),
      driveType: getValueByName('Drive Type'),
      bodyClass: getValueByName('Body Class'),
      doors: getValueByName('Doors'),
      plantCountry: getValueByName('Plant Country'),
      vehicleType: getValueByName('Vehicle Type'),
      vin: vin,
      isEuropean: isEuropean,
      warning: isEuropean ? 'Европейски VIN - данните може да са непълни. Моля, проверете и коригирайте информацията.' : null
    };

    res.json(carData);
  } catch (err) {
    console.error('VIN decode error:', err);
    res.status(500).json({ error: 'Грешка при декодиране на VIN' });
  }
});

// Декодиране на година от 10-ти символ на VIN
function decodeYearFromVin(char) {
  const yearCodes = {
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
    'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
    'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
    'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
    'Y': 2030,
    '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
    '6': 2006, '7': 2007, '8': 2008, '9': 2009
  };
  return yearCodes[char.toUpperCase()] || null;
}

// Helper функции за mapping на стойности
function mapFuelType(fuelType) {
  if (!fuelType) return '';
  const lower = fuelType.toLowerCase();
  if (lower.includes('diesel')) return 'Diesel';
  if (lower.includes('electric')) return 'Electric';
  if (lower.includes('hybrid')) return 'Hybrid';
  if (lower.includes('gasoline') || lower.includes('petrol')) return 'Benzin';
  if (lower.includes('lpg')) return 'LPG';
  if (lower.includes('cng') || lower.includes('natural gas')) return 'CNG';
  return '';
}

function mapTransmission(transmission) {
  if (!transmission) return '';
  const lower = transmission.toLowerCase();
  if (lower.includes('manual')) return 'Manual';
  if (lower.includes('automatic') || lower.includes('cvt')) return 'Automatic';
  if (lower.includes('semi')) return 'Semi-Auto';
  return '';
}

// Get all cars for user
router.get('/', auth, async (req, res) => {
  try {
    const { Car } = getModels(req);
    const cars = await Car.findAll({ where: { userId: req.user.id } });
    res.json(cars);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add new car
router.post('/',
  auth,
  body('brand').notEmpty().withMessage('Brand is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { Car } = getModels(req);
      const { 
        brand, model, year, licensePlate, 
        vin, engineType, horsepower, transmission, euroStandard, mileage, fuelType,
        tireWidth, tireHeight, tireDiameter, tireSeason, tireBrand, tireDot 
      } = req.body;

      const car = await Car.create({
        userId: req.user.id,
        brand,
        model,
        year,
        licensePlate,
        vin, engineType, horsepower, transmission, euroStandard, mileage, fuelType,
        tireWidth, tireHeight, tireDiameter, tireSeason, tireBrand, tireDot
      });

      res.json(car);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Update car
router.put('/:id', auth, async (req, res) => {
  try {
    const { Car } = getModels(req);
    let car = await Car.findByPk(req.params.id);

    if (!car) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    if (car.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { 
      brand, model, year, licensePlate,
      vin, engineType, horsepower, transmission, euroStandard, mileage, fuelType,
      tireWidth, tireHeight, tireDiameter, tireSeason, tireBrand, tireDot 
    } = req.body;

    if (brand) car.brand = brand;
    if (model) car.model = model;
    if (year) car.year = year;
    if (licensePlate) car.licensePlate = licensePlate;
    
    // Update optional fields regardless if they are present strings or null (to allow clearing)
    // Checking undefined to only update if sent in body
    if (vin !== undefined) car.vin = vin;
    if (engineType !== undefined) car.engineType = engineType;
    if (horsepower !== undefined) car.horsepower = horsepower;
    if (transmission !== undefined) car.transmission = transmission;
    if (euroStandard !== undefined) car.euroStandard = euroStandard;
    if (mileage !== undefined) car.mileage = mileage;
    if (fuelType !== undefined) car.fuelType = fuelType;
    if (tireWidth !== undefined) car.tireWidth = tireWidth;
    if (tireHeight !== undefined) car.tireHeight = tireHeight;
    if (tireDiameter !== undefined) car.tireDiameter = tireDiameter;
    if (tireSeason !== undefined) car.tireSeason = tireSeason;
    if (tireBrand !== undefined) car.tireBrand = tireBrand;
    if (tireDot !== undefined) car.tireDot = tireDot;

    await car.save();
    res.json(car);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete car
router.delete('/:id', auth, async (req, res) => {
  try {
    const { Car } = getModels(req);
    const car = await Car.findByPk(req.params.id);

    if (!car) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    if (car.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await car.destroy();
    res.json({ msg: 'Car removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
