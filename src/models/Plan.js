const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
  },
  monthly_price: {
    type: DataTypes.DECIMAL(12, 2),
  },
  annual_price: {
    type: DataTypes.DECIMAL(12, 2),
  },
  monthly_coverage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  type: {
    type: DataTypes.ENUM('patient', 'professional'),
    defaultValue: 'patient',
  },
}, {
  timestamps: false,
  tableName: 'plans',
});

module.exports = Plan;
