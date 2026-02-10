const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');
const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const serviceRoutes = require('./routes/services');
const adminRoutes = require('./routes/admin');
const reminderService = require('./services/reminderService');

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://car-guard.netlify.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Store supabase client in app.locals for route access
app.locals.supabase = supabase;

// Function to create default admin user
const createDefaultAdmin = async () => {
  try {
    // Check if admin exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const { error } = await supabase
        .from('admins')
        .insert({
          username: 'admin',
          password: hashedPassword,
          name: 'Administrator'
        });

      if (error) {
        console.error('Error creating default admin:', error);
      } else {
        console.log('✅ Default admin user created: admin / admin123');
      }
    }
  } catch (err) {
    // Admin might already exist from SQL schema
    console.log('Admin check completed');
  }
};

// Test database connection and initialize
const initializeDatabase = async () => {
  try {
    // Test connection by querying users table
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection error:', error.message);
      console.error('Make sure you have run the SQL schema in Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Connected to Supabase database');
    
    // Create default admin if doesn't exist
    await createDefaultAdmin();
    
    // Start reminder service
    reminderService.startReminderCheck(supabase);
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
};

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'supabase' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
