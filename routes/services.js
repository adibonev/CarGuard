const express = require('express');
const { body, validationResult } = require('express-validator');
const Service = require('../models/Service');
const Car = require('../models/Car');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all services for a car
router.get('/car/:carId', auth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);

    if (!car) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    if (car.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const services = await Service.find({ carId: req.params.carId });
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add service
router.post('/',
  auth,
  body('carId').notEmpty().withMessage('Car ID is required'),
  body('serviceType').isIn(['гражданска', 'винетка', 'преглед', 'каско', 'данък']).withMessage('Invalid service type'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { carId, serviceType, expiryDate } = req.body;

      const car = await Car.findById(carId);

      if (!car) {
        return res.status(404).json({ msg: 'Car not found' });
      }

      if (car.userId.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const service = new Service({
        carId,
        userId: req.user.id,
        serviceType,
        expiryDate
      });

      await service.save();
      res.json(service);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Update service
router.put('/:id', auth, async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    if (service.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { serviceType, expiryDate } = req.body;

    if (serviceType) service.serviceType = serviceType;
    if (expiryDate) {
      service.expiryDate = expiryDate;
      service.reminderSent = false; // Reset reminder when date changes
    }

    await service.save();
    res.json(service);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete service
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    if (service.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Service removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
