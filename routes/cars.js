const express = require('express');
const { body, validationResult } = require('express-validator');
const Car = require('../models/Car');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all cars for user
router.get('/', auth, async (req, res) => {
  try {
    const cars = await Car.find({ userId: req.user.id });
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
      const { brand, model, year, licensePlate } = req.body;

      const car = new Car({
        userId: req.user.id,
        brand,
        model,
        year,
        licensePlate
      });

      await car.save();
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
    let car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    if (car.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { brand, model, year, licensePlate } = req.body;

    if (brand) car.brand = brand;
    if (model) car.model = model;
    if (year) car.year = year;
    if (licensePlate) car.licensePlate = licensePlate;

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
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    if (car.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Car.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Car removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
