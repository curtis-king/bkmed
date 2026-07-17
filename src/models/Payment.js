const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  payer_id: {
    type: DataTypes.BIGINT,
  },
  beneficiary_id: {
    type: DataTypes.BIGINT,
  },
  request_id: {
    type: DataTypes.BIGINT,
  },
  subscription_id: {
    type: DataTypes.BIGINT,
  },
  dependent_id: {
    type: DataTypes.BIGINT,
  },
  payment_type: {
    type: DataTypes.ENUM('REGISTRATION', 'SUBSCRIPTION', 'SERVICE'),
  },
  method: {
    type: DataTypes.ENUM('MOBILE_MONEY', 'CARD', 'CASH'),
  },
  mobile_money_provider: {
    type: DataTypes.ENUM('mtn', 'airtel'),
  },
  mobile_money_phone: {
    type: DataTypes.STRING(20),
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'FAILED'),
    defaultValue: 'PENDING',
  },
  withdrawal_code: {
    type: DataTypes.STRING(100),
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'payments',
});

module.exports = Payment;
