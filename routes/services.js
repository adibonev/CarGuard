const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Get models from request context
const getModels = (req) => req.app.locals.models;

// Get all services for a car
router.get('/car/:carId', auth, async (req, res) => {
  try {
    const { Car, Service } = getModels(req);
    const car = await Car.findByPk(req.params.carId);

    if (!car) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    if (car.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const services = await Service.findAll({ where: { carId: req.params.carId } });
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all services for the user (all cars)
router.get('/all', auth, async (req, res) => {
  try {
    const { Service, Car } = getModels(req);
    const services = await Service.findAll({
      where: { userId: req.user.id },
      include: [{ model: Car, as: 'car' }],
      order: [['expiryDate', 'ASC']]
    });
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
      const { Car, Service } = getModels(req);
      const { carId, serviceType, expiryDate, cost } = req.body;

      const car = await Car.findByPk(carId);

      if (!car) {
        return res.status(404).json({ msg: 'Car not found' });
      }

      if (car.userId !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const service = await Service.create({
        carId,
        userId: req.user.id,
        serviceType,
        expiryDate,
        cost: cost || 0
      });

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
    const { Service } = getModels(req);
    let service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    if (service.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { serviceType, expiryDate, cost } = req.body;

    if (serviceType) service.serviceType = serviceType;
    if (expiryDate) {
      service.expiryDate = expiryDate;
      service.reminderSent = false;
    }
    if (cost !== undefined) service.cost = cost;

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
    const { Service } = getModels(req);
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    if (service.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await service.destroy();
    res.json({ msg: 'Service removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
