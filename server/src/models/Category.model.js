const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'categories',
  timestamps: true,
});

module.exports = Category;
