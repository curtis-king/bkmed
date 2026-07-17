const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  medical_case_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'prescriptions',
});

module.exports = Prescription;
