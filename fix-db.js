const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: console.log
});

async function fixDatabase() {
  try {
    // Drop backup tables
    await sequelize.query('DROP TABLE IF EXISTS Cars_backup;');
    await sequelize.query('DROP TABLE IF EXISTS Users_backup;');
    await sequelize.query('DROP TABLE IF EXISTS Services_backup;');
    await sequelize.query('DROP TABLE IF EXISTS Admins_backup;');
    console.log('✅ Backup tables dropped successfully');
    
    await sequelize.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

fixDatabase();
