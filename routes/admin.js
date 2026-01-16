const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Op, fn, col, literal } = require('sequelize');

const router = express.Router();

// Get models from request context
const getModels = (req) => req.app.locals.models;

// Admin auth middleware
const adminAuth = (req, res, next) => {
  const token = req.header('x-admin-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET + '_admin');
    req.admin = decoded.admin;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Admin Login
router.post('/login',
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { Admin } = getModels(req);
      const { username, password } = req.body;

      const admin = await Admin.findOne({ where: { username } });
      if (!admin) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Update last login
      await admin.update({ lastLogin: new Date() });

      const payload = {
        admin: {
          id: admin.id,
          username: admin.username
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET + '_admin',
        { expiresIn: '8h' },
        (err, token) => {
          if (err) throw err;
          res.json({ 
            token, 
            admin: { 
              id: admin.id, 
              username: admin.username, 
              name: admin.name 
            } 
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Verify admin token
router.get('/verify', adminAuth, async (req, res) => {
  try {
    const { Admin } = getModels(req);
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: ['id', 'username', 'name']
    });
    res.json(admin);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const { User, Car, Service } = getModels(req);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Total counts
    const totalUsers = await User.count();
    const totalCars = await Car.count();
    const totalServices = await Service.count();

    // New registrations
    const newUsersToday = await User.count({
      where: { createdAt: { [Op.gte]: today } }
    });
    const newUsersWeek = await User.count({
      where: { createdAt: { [Op.gte]: weekAgo } }
    });
    const newUsersMonth = await User.count({
      where: { createdAt: { [Op.gte]: monthAgo } }
    });

    // Expiring services (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringServices = await Service.count({
      where: {
        expiryDate: {
          [Op.between]: [today, thirtyDaysFromNow]
        }
      }
    });

    const expiredServices = await Service.count({
      where: {
        expiryDate: { [Op.lt]: today }
      }
    });

    res.json({
      totalUsers,
      totalCars,
      totalServices,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      expiringServices,
      expiredServices
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all users with their cars and services count
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { User, Car, Service } = getModels(req);
    
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    // Get car and service counts for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const carCount = await Car.count({ where: { userId: user.id } });
      const cars = await Car.findAll({ where: { userId: user.id } });
      const carIds = cars.map(c => c.id);
      
      let serviceCount = 0;
      if (carIds.length > 0) {
        serviceCount = await Service.count({ where: { carId: carIds } });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        carCount,
        serviceCount
      };
    }));

    res.json(usersWithStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get registration chart data (last 30 days)
router.get('/chart/registrations', adminAuth, async (req, res) => {
  try {
    const { User } = getModels(req);
    const sequelize = User.sequelize;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // For SQLite, we need to use date function
    const registrations = await User.findAll({
      attributes: [
        [fn('date', col('createdAt')), 'date'],
        [fn('count', col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      group: [fn('date', col('createdAt'))],
      order: [[fn('date', col('createdAt')), 'ASC']],
      raw: true
    });

    res.json(registrations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get popular car brands
router.get('/chart/brands', adminAuth, async (req, res) => {
  try {
    const { Car } = getModels(req);
    
    const brands = await Car.findAll({
      attributes: [
        'brand',
        [fn('count', col('id')), 'count']
      ],
      group: ['brand'],
      order: [[fn('count', col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json(brands);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get service types distribution
router.get('/chart/services', adminAuth, async (req, res) => {
  try {
    const { Service } = getModels(req);
    
    const services = await Service.findAll({
      attributes: [
        'serviceType',
        [fn('count', col('id')), 'count']
      ],
      group: ['serviceType'],
      order: [[fn('count', col('id')), 'DESC']],
      raw: true
    });

    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
