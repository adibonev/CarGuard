const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get supabase client from request context
const getSupabase = (req) => req.app.locals.supabase;

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
      const supabase = getSupabase(req);
      const { username, password } = req.body;

      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !admin) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Update last login
      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);

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
    const supabase = getSupabase(req);
    
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, username, name')
      .eq('id', req.admin.id)
      .single();

    if (error || !admin) {
      return res.status(404).json({ msg: 'Admin not found' });
    }

    res.json(admin);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Total counts
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: totalCars } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });

    const { count: totalServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    // New registrations
    const { count: newUsersToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: newUsersWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    const { count: newUsersMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    // Expiring services (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { count: expiringServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .gte('expiry_date', today.toISOString())
      .lte('expiry_date', thirtyDaysFromNow.toISOString());

    const { count: expiredServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .lt('expiry_date', today.toISOString());

    res.json({
      totalUsers: totalUsers || 0,
      totalCars: totalCars || 0,
      totalServices: totalServices || 0,
      newUsersToday: newUsersToday || 0,
      newUsersWeek: newUsersWeek || 0,
      newUsersMonth: newUsersMonth || 0,
      expiringServices: expiringServices || 0,
      expiredServices: expiredServices || 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all users with their cars and services count
router.get('/users', adminAuth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    // Get car and service counts for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const { count: carCount } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: serviceCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        carCount: carCount || 0,
        serviceCount: serviceCount || 0
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
    const supabase = getSupabase(req);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: users, error } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    // Group by date
    const registrations = {};
    users.forEach(user => {
      const date = user.created_at.split('T')[0];
      registrations[date] = (registrations[date] || 0) + 1;
    });

    // Convert to array format
    const result = Object.entries(registrations)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get popular car brands
router.get('/chart/brands', adminAuth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    const { data: cars, error } = await supabase
      .from('cars')
      .select('brand');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    // Group by brand
    const brandCounts = {};
    cars.forEach(car => {
      brandCounts[car.brand] = (brandCounts[car.brand] || 0) + 1;
    });

    // Convert to array and sort
    const result = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get service types distribution
router.get('/chart/services', adminAuth, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    const { data: services, error } = await supabase
      .from('services')
      .select('service_type');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Server error');
    }

    // Group by service type
    const serviceCounts = {};
    services.forEach(service => {
      serviceCounts[service.service_type] = (serviceCounts[service.service_type] || 0) + 1;
    });

    // Convert to array and sort
    const result = Object.entries(serviceCounts)
      .map(([serviceType, count]) => ({ serviceType, count }))
      .sort((a, b) => b.count - a.count);

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
