const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: console.log
});

const Admin = require('./models/Admin')(sequelize);

async function seedAdmin() {
  try {
    console.log('Syncing database...');
    await sequelize.sync({ force: false });
    console.log('Database synced!');
    
    // Check if admin already exists
    console.log('Checking for existing admin...');
    const existingAdmin = await Admin.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      console.log('\n✅ Admin user already exists!');
      console.log('================================');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('================================');
      console.log('Access admin panel at: http://localhost:3000/admin');
      process.exit(0);
    }

    // Create default admin
    console.log('Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await Admin.create({
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator'
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('================================');
    console.log('⚠️  Please change the password after first login!');
    console.log('Access admin panel at: http://localhost:3000/admin');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

seedAdmin();
