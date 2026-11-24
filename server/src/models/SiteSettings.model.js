const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SiteSettings = sequelize.define('SiteSettings', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  value: { type: DataTypes.TEXT, allowNull: true },   // stored as JSON string
}, {
  tableName: 'site_settings',
  timestamps: true,
});

module.exports = SiteSettings;
