const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get supabase client from request context
const getSupabase = (req) => req.app.locals.supabase;

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.user.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Register
router.post('/register',
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const supabase = getSupabase(req);
      const { name, email, password } = req.body;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          reminder_days: 30
        })
        .select('id, name, email, reminder_days')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ msg: 'Error creating user' });
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({ 
            token, 
            user: { 
              id: user.id, 
              name: user.name, 
              email: user.email, 
              reminderDays: user.reminder_days 
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

// Login
router.post('/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const supabase = getSupabase(req);
      const { email, password } = req.body;

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({ 
            token, 
            user: { 
              id: user.id, 
              name: user.name, 
              email: user.email, 
              reminderDays: user.reminder_days 
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

// Get user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, reminder_days')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      reminderDays: user.reminder_days
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update reminder days
router.put('/reminder-days', verifyToken, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const { reminderDays } = req.body;

    if (!reminderDays || reminderDays < 1 || reminderDays > 365) {
      return res.status(400).json({ msg: 'Reminder days must be between 1 and 365' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ reminder_days: reminderDays })
      .eq('id', req.userId)
      .select('reminder_days')
      .single();

    if (error) {
      return res.status(500).json({ msg: 'Error updating reminder days' });
    }

    res.json({ msg: 'Reminder days updated successfully', reminderDays: user.reminder_days });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

