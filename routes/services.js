const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Get supabase client from request context
const getSupabase = (req) => req.app.locals.supabase;

// Helper function to transform service from snake_case to camelCase
const transformService = (service) => ({
  id: service.id,
  carId: service.car_id,
  userId: service.user_id,
  serviceType: service.service_type,
  expiryDate: service.expiry_date,
  cost: service.cost,
  notes: service.notes,
  liters: service.liters,
  pricePerLiter: service.price_per_liter,
  fuelType: service.fuel_type,
  reminderSent: service.reminder_sent,
  createdAt: service.created_at,
  updatedAt: service.updated_at,
  car: service.cars ? {
    id: service.cars.id,
    brand: service.cars.brand,
    model: service.cars.model,
    year: service.cars.year,
    licensePlate: service.cars.license_plate
  } : undefined
});

// Get all services for a car
router.get('/car/:carId', auth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    // Check if car exists and belongs to user
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('user_id')
      .eq('id', req.params.carId)
      .single();

    if (carError || !car) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    if (car.user_id !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('car_id', req.params.carId)
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    res.json(services.map(transformService));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all services for the user (all cars)
router.get('/all', auth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        cars (id, brand, model, year, license_plate)
      `)
      .eq('user_id', req.user.id)
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    res.json(services.map(transformService));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add service
router.post('/',
  auth,
  body('carId').notEmpty().withMessage('Car ID is required'),
  body('serviceType').isIn(['гражданска', 'винетка', 'преглед', 'каско', 'данък', 'пожарогасител', 'ремонт', 'обслужване', 'гуми', 'зареждане', 'друго']).withMessage('Invalid service type'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const supabase = getSupabase(req);
      const { carId, serviceType, expiryDate, cost, notes, liters, pricePerLiter, fuelType } = req.body;

      // Check if car exists and belongs to user
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('user_id')
        .eq('id', carId)
        .single();

      if (carError || !car) {
        return res.status(404).json({ msg: 'Car not found' });
      }

      if (car.user_id !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const { data: service, error } = await supabase
        .from('services')
        .insert({
          car_id: carId,
          user_id: req.user.id,
          service_type: serviceType,
          expiry_date: expiryDate,
          cost: cost || 0,
          notes,
          liters,
          price_per_liter: pricePerLiter,
          fuel_type: fuelType
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).send('Server error');
      }

      // Записване в service_logs таблица
      const { data: userInfo } = await supabase
        .from('users')
        .select('email')
        .eq('id', req.user.id)
        .single();

      if (userInfo) {
        await supabase
          .from('service_logs')
          .insert({
            user_id: req.user.id,
            email: userInfo.email,
            service_type: serviceType,
            car_id: carId,
            description: notes || ''
          });
      }

      res.json(transformService(service));
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Update service
router.put('/:id', auth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    // Check if service exists and belongs to user
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('user_id, reminder_sent')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingService) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    if (existingService.user_id !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { serviceType, expiryDate, cost, notes, liters, pricePerLiter, fuelType } = req.body;

    // Build update object
    const updateData = {};
    if (serviceType !== undefined) updateData.service_type = serviceType;
    if (expiryDate !== undefined) {
      updateData.expiry_date = expiryDate;
      updateData.reminder_sent = false; // Reset reminder when date changes
    }
    if (cost !== undefined) updateData.cost = cost;
    if (notes !== undefined) updateData.notes = notes;
    if (liters !== undefined) updateData.liters = liters;
    if (pricePerLiter !== undefined) updateData.price_per_liter = pricePerLiter;
    if (fuelType !== undefined) updateData.fuel_type = fuelType;

    const { data: service, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    res.json(transformService(service));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete service
router.delete('/:id', auth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    // Check if service exists and belongs to user
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    if (service.user_id !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    res.json({ msg: 'Service removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
