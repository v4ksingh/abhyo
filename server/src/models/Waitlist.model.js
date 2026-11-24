const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Waitlist = sequelize.define('Waitlist', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'invited', 'unsubscribed'),
    defaultValue: 'active',
  }
}, {
  tableName: 'waitlists',
  timestamps: true,
});

module.exports = Waitlist;
