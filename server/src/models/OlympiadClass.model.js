const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadClass = sequelize.define('OlympiadClass', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  classNumber:{ type: DataTypes.INTEGER, allowNull: false, unique: true, validate: { min: 6, max: 12 } },
  label:      { type: DataTypes.STRING(30), allowNull: false }, // e.g. "Class 6"
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'olympiad_classes',
  indexes: [{ fields: ['classNumber'] }],
});

module.exports = OlympiadClass;
