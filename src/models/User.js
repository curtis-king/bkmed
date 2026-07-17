const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  dossier_number: {
    type: DataTypes.STRING(50),
    unique: true,
  },
  first_name: {
    type: DataTypes.STRING(100),
  },
  last_name: {
    type: DataTypes.STRING(100),
  },
  phone: {
    type: DataTypes.STRING(30),
    unique: true,
  },
  email: {
    type: DataTypes.STRING(150),
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
  },
  photo_profile: {
    type: DataTypes.STRING(255),
  },
  birth_date: {
    type: DataTypes.DATEONLY,
  },
  gender: {
    type: DataTypes.STRING(20),
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verification_level: {
    type: DataTypes.ENUM('UNVERIFIED', 'IDENTITY_VERIFIED', 'PROFESSION_VERIFIED'),
    defaultValue: 'UNVERIFIED',
  },
  quota_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_dependent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  dependent_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  availability: {
    type: DataTypes.ENUM('AVAILABLE', 'BUSY', 'UNAVAILABLE'),
    defaultValue: 'AVAILABLE',
  },
  pays: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  departement_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  arrondissement_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

User.prototype.verifierMotDePasse = async function (mdp) {
  return bcrypt.compare(mdp, this.password);
};

module.exports = User;
