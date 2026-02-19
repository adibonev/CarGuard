const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Get supabase client from request context
const getSupabase = (req) => req.app.locals.supabase;

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
    const supabase = getSupabase(req);
    
    const { data: cars, error } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedCars = cars.map(car => ({
      id: car.id,
      userId: car.user_id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      licensePlate: car.license_plate,
      vin: car.vin,
      engineType: car.engine_type,
      horsepower: car.horsepower,
      transmission: car.transmission,
      euroStandard: car.euro_standard,
      mileage: car.mileage,
      fuelType: car.fuel_type,
      tireWidth: car.tire_width,
      tireHeight: car.tire_height,
      tireDiameter: car.tire_diameter,
      tireSeason: car.tire_season,
      tireBrand: car.tire_brand,
      tireDot: car.tire_dot,
      createdAt: car.created_at,
      updatedAt: car.updated_at
    }));

    res.json(transformedCars);
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
      const supabase = getSupabase(req);
      const { 
        brand, model, year, licensePlate, 
        vin, engineType, horsepower, transmission, euroStandard, mileage, fuelType,
        tireWidth, tireHeight, tireDiameter, tireSeason, tireBrand, tireDot 
      } = req.body;

      const { data: car, error } = await supabase
        .from('cars')
        .insert({
          user_id: req.user.id,
          brand,
          model,
          year,
          license_plate: licensePlate,
          vin,
          engine_type: engineType,
          horsepower,
          transmission,
          euro_standard: euroStandard,
          mileage,
          fuel_type: fuelType,
          tire_width: tireWidth,
          tire_height: tireHeight,
          tire_diameter: tireDiameter,
          tire_season: tireSeason,
          tire_brand: tireBrand,
          tire_dot: tireDot
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).send('Server error');
      }

      // Transform to camelCase
      const transformedCar = {
        id: car.id,
        userId: car.user_id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        licensePlate: car.license_plate,
        vin: car.vin,
        engineType: car.engine_type,
        horsepower: car.horsepower,
        transmission: car.transmission,
        euroStandard: car.euro_standard,
        mileage: car.mileage,
        fuelType: car.fuel_type,
        tireWidth: car.tire_width,
        tireHeight: car.tire_height,
        tireDiameter: car.tire_diameter,
        tireSeason: car.tire_season,
        tireBrand: car.tire_brand,
        tireDot: car.tire_dot,
        createdAt: car.created_at,
        updatedAt: car.updated_at
      };

      res.json(transformedCar);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Update car
router.put('/:id', auth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    // Check if car exists and belongs to user
    const { data: existingCar, error: fetchError } = await supabase
      .from('cars')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingCar) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    if (existingCar.user_id !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { 
      brand, model, year, licensePlate,
      vin, engineType, horsepower, transmission, euroStandard, mileage, fuelType,
      tireWidth, tireHeight, tireDiameter, tireSeason, tireBrand, tireDot 
    } = req.body;

    // Build update object with snake_case keys
    const updateData = {};
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (year !== undefined) updateData.year = year;
    if (licensePlate !== undefined) updateData.license_plate = licensePlate;
    if (vin !== undefined) updateData.vin = vin;
    if (engineType !== undefined) updateData.engine_type = engineType;
    if (horsepower !== undefined) updateData.horsepower = horsepower;
    if (transmission !== undefined) updateData.transmission = transmission;
    if (euroStandard !== undefined) updateData.euro_standard = euroStandard;
    if (mileage !== undefined) updateData.mileage = mileage;
    if (fuelType !== undefined) updateData.fuel_type = fuelType;
    if (tireWidth !== undefined) updateData.tire_width = tireWidth;
    if (tireHeight !== undefined) updateData.tire_height = tireHeight;
    if (tireDiameter !== undefined) updateData.tire_diameter = tireDiameter;
    if (tireSeason !== undefined) updateData.tire_season = tireSeason;
    if (tireBrand !== undefined) updateData.tire_brand = tireBrand;
    if (tireDot !== undefined) updateData.tire_dot = tireDot;

    const { data: car, error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    // Transform to camelCase
    const transformedCar = {
      id: car.id,
      userId: car.user_id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      licensePlate: car.license_plate,
      vin: car.vin,
      engineType: car.engine_type,
      horsepower: car.horsepower,
      transmission: car.transmission,
      euroStandard: car.euro_standard,
      mileage: car.mileage,
      fuelType: car.fuel_type,
      tireWidth: car.tire_width,
      tireHeight: car.tire_height,
      tireDiameter: car.tire_diameter,
      tireSeason: car.tire_season,
      tireBrand: car.tire_brand,
      tireDot: car.tire_dot,
      createdAt: car.created_at,
      updatedAt: car.updated_at
    };

    res.json(transformedCar);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete car
router.delete('/:id', auth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    // Check if car exists and belongs to user
    const { data: car, error: fetchError } = await supabase
      .from('cars')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !car) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    if (car.user_id !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    res.json({ msg: 'Car removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
