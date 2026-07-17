const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalCase = sequelize.define('MedicalCase', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  request_id: {
    type: DataTypes.BIGINT,
    unique: true,
  },
  doctor_id: {
    type: DataTypes.BIGINT,
  },
  symptoms: {
    type: DataTypes.TEXT,
  },
  diagnosis: {
    type: DataTypes.TEXT,
  },
  treatment: {
    type: DataTypes.TEXT,
  },
  observations: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: false,
  tableName: 'medical_cases',
});

module.exports = MedicalCase;
