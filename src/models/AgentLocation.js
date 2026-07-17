const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AgentLocation = sequelize.define('AgentLocation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  agent_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
  },
  recorded_at: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: false,
  tableName: 'agent_locations',
});

module.exports = AgentLocation;
