const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Car = sequelize.define('Car', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    licensePlate: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vin: {
      type: DataTypes.STRING,
      allowNull: true
    },
    engineType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    horsepower: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    transmission: {
      type: DataTypes.STRING,
      allowNull: true
    },
    euroStandard: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mileage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fuelType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tireWidth: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tireHeight: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tireDiameter: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tireSeason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tireBrand: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tireDot: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return Car;
};
