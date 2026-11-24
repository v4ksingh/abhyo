const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadSubject = sequelize.define('OlympiadSubject', {
  id:   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  icon:  { type: DataTypes.STRING(500), allowNull: true },
  color: { type: DataTypes.STRING(30), defaultValue: '#6366f1' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'olympiad_subjects',
});

module.exports = OlympiadSubject;
