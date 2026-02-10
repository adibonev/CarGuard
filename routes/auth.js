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
          reminder_days: 30,
          reminder_enabled: true
        })
        .select('id, name, email, reminder_days, reminder_enabled')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ msg: 'Error creating user' });
      }

      // Записване в accounts таблица
      await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: user.name,
          email: user.email,
          phone: '' // Телефонът може да се добави по-късно
        });

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
              reminderDays: user.reminder_days,
              reminderEnabled: user.reminder_enabled
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
              reminderDays: user.reminder_days,
              reminderEnabled: user.reminder_enabled
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
      .select('id, name, email, reminder_days, reminder_enabled')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      reminderDays: user.reminder_days,
      reminderEnabled: user.reminder_enabled
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

// Update reminder enabled
router.put('/reminder-enabled', verifyToken, async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const { reminderEnabled } = req.body;

    if (typeof reminderEnabled !== 'boolean') {
      return res.status(400).json({ msg: 'reminderEnabled must be boolean' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ reminder_enabled: reminderEnabled })
      .eq('id', req.userId)
      .select('reminder_enabled')
      .single();

    if (error) {
      return res.status(500).json({ msg: 'Error updating reminder enabled' });
    }

    res.json({ msg: 'Reminder enabled updated successfully', reminderEnabled: user.reminder_enabled });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Google OAuth callback
router.post('/google-callback', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const { email, name, googleId, emailVerified } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    // Check if user exists
    let { data: user } = await supabase
      .from('users')
      .select('id, name, email, reminder_days, reminder_enabled, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    // If user doesn't exist, create new user
    if (!user) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          password: null, // Google users don't have password
          google_id: googleId,
          reminder_days: 30,
          reminder_enabled: true,
          email_verified: emailVerified || false
        })
        .select('id, name, email, reminder_days, reminder_enabled, email_verified')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ msg: 'Error creating user' });
      }

      user = newUser;

      // Create account record
      await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: user.name,
          email: user.email,
          phone: null
        });
    } else {
      // Update existing user with Google ID if not already set
      if (!user.google_id) {
        await supabase
          .from('users')
          .update({ 
            google_id: googleId,
            email_verified: emailVerified || user.email_verified
          })
          .eq('id', user.id);

        user.email_verified = emailVerified || user.email_verified;
      }
    }

    // Create JWT token
    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      msg: 'Google sign-in successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        reminderDays: user.reminder_days,
        reminderEnabled: user.reminder_enabled,
        emailVerified: user.email_verified
      },
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


router.post('/send-verification-email', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ msg: 'Email already verified' });
    }

    // Generate verification token (in production, use Supabase's built-in email verification)
    // For now, use Supabase's auth email verification
    const { error } = await supabase.auth.admin.sendRawEmail({
      to: email,
      html: `
        <h2>Verify Your Email</h2>
        <p>Click the link below to verify your email address:</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?email=${email}">
          Verify Email
        </a>
      `
    });

    if (error) {
      console.error('Email send error:', error);
      return res.status(500).json({ msg: 'Failed to send verification email' });
    }

    res.json({ msg: 'Verification email sent successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    // Update user email verification status
    const { data: user, error } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('email', email.toLowerCase())
      .select('id, email, email_verified')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ msg: 'Error verifying email' });
    }

    res.json({ 
      msg: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
