const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pays = sequelize.define('Pays', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  nationality: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'pays',
});

module.exports = Pays;
