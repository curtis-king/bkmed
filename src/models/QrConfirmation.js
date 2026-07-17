const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QrConfirmation = sequelize.define('QrConfirmation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  request_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  patient_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  agent_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  confirmation_type: {
    type: DataTypes.ENUM('QR_SCAN', 'BUTTON_CONFIRM'),
  },
  confirmed_by_patient: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  confirmed_by_agent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  confirmed_at: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: false,
  tableName: 'qr_confirmations',
});

module.exports = QrConfirmation;
