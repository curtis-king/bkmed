const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  request_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
  },
  date: {
    type: DataTypes.DATE,
  },
  location: {
    type: DataTypes.STRING(255),
  },
  notes: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
    defaultValue: 'SCHEDULED',
  },
  created_by: {
    type: DataTypes.BIGINT,
  },
  proposed_by: {
    type: DataTypes.ENUM('MEDECIN', 'PATIENT'),
    defaultValue: 'MEDECIN',
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'appointments',
});

module.exports = Appointment;
