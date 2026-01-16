const express = require('express');
const { Sequelize } = require('sequelize');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const serviceRoutes = require('./routes/services');
const adminRoutes = require('./routes/admin');
const reminderService = require('./services/reminderService');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

// Import models
const User = require('./models/User')(sequelize);
const Car = require('./models/Car')(sequelize);
const Service = require('./models/Service')(sequelize);
const Admin = require('./models/Admin')(sequelize);

// Store models in app.locals for route access
app.locals.models = { User, Car, Service, Admin };

// Sync database
sequelize.sync().then(() => {
  console.log('Database synced successfully');
  // Start reminder service after database is synced
  reminderService.startReminderCheck({ User, Car, Service });
}).catch(err => {
  console.log('Database sync error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
