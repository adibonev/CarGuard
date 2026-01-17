const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Get models from request context
const getModels = (req) => req.app.locals.models;

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
