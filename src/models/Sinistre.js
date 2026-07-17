const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sinistre = sequelize.define('Sinistre', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  vehicle_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  incident_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  incident_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('SUBMITTED', 'IN_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELLED'),
    defaultValue: 'SUBMITTED',
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'sinistres',
});

module.exports = Sinistre;
