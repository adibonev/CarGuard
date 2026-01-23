const sequelize = require('./config/database');
const { DataTypes } = require('sequelize');

async function migrateDatabase() {
  try {
    // Get the Car table
    const Car = sequelize.models.Car;
    
    // Add missing columns to Cars table
    const columns = await sequelize.getQueryInterface().describeTable('Cars');
    
    const missingColumns = {
      tireWidth: DataTypes.INTEGER,
      tireHeight: DataTypes.INTEGER,
      tireDiameter: DataTypes.INTEGER,
      tireSeason: DataTypes.STRING,
      tireBrand: DataTypes.STRING,
      tireDot: DataTypes.STRING,
    };

    for (const [colName, dataType] of Object.entries(missingColumns)) {
      if (!columns[colName]) {
        console.log(`Adding column ${colName}...`);
        await sequelize.getQueryInterface().addColumn('Cars', colName, {
          type: dataType,
          allowNull: true
        });
        console.log(`✅ Added ${colName}`);
      } else {
        console.log(`✓ Column ${colName} already exists`);
      }
    }

    console.log('✅ Database migration completed!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await sequelize.close();
  }
}

migrateDatabase();
