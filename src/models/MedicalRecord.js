const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalRecord = sequelize.define('MedicalRecord', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    unique: true,
  },
  dependent_id: {
    type: DataTypes.BIGINT,
    unique: true,
  },
  privacy_level: {
    type: DataTypes.ENUM('PRIVATE', 'SHARED_MEDCONNECT', 'PUBLIC'),
    defaultValue: 'SHARED_MEDCONNECT',
  },
  blood_group: {
    type: DataTypes.STRING(10),
  },
  allergies: {
    type: DataTypes.TEXT,
  },
  medical_history: {
    type: DataTypes.TEXT,
  },
  height: {
    type: DataTypes.DECIMAL(5, 1),
  },
  weight: {
    type: DataTypes.DECIMAL(5, 1),
  },
  blood_pressure_systolic: {
    type: DataTypes.INTEGER,
  },
  blood_pressure_diastolic: {
    type: DataTypes.INTEGER,
  },
  heart_rate: {
    type: DataTypes.INTEGER,
  },
  temperature: {
    type: DataTypes.DECIMAL(4, 1),
  },
  respiratory_rate: {
    type: DataTypes.INTEGER,
  },
  oxygen_saturation: {
    type: DataTypes.INTEGER,
  },
  blood_sugar: {
    type: DataTypes.DECIMAL(5, 2),
  },
  chronic_diseases: {
    type: DataTypes.TEXT,
  },
  emergency_contact_name: {
    type: DataTypes.STRING(150),
  },
  emergency_contact_phone: {
    type: DataTypes.STRING(30),
  },
  nationalite: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'medical_records',
});

module.exports = MedicalRecord;
