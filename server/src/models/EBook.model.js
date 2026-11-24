const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EBook = sequelize.define('EBook', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  title:       { type: DataTypes.STRING(300), allowNull: false },
  slug:        { type: DataTypes.STRING(250), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  author:      { type: DataTypes.STRING(200), allowNull: true },
  category:    { type: DataTypes.STRING(100), defaultValue: 'General' },
  tags:        { type: DataTypes.JSON, defaultValue: [] },          // array of strings

  // Cover image (stored in /uploads)
  coverImage:  { type: DataTypes.STRING(500), allowNull: true },

  // PDF file (stored in /uploads)
  fileUrl:     { type: DataTypes.STRING(500), allowNull: true },
  fileSize:    { type: DataTypes.INTEGER, defaultValue: 0 },         // bytes
  totalPages:  { type: DataTypes.INTEGER, defaultValue: 0 },

  // Pricing
  isFree:      { type: DataTypes.BOOLEAN, defaultValue: false },
  price:       { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  mrp:         { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },  // strike-through price

  // Access control
  accessType:  { type: DataTypes.ENUM('free', 'paid', 'plan'), defaultValue: 'paid' },
  // 'free' → everyone, 'paid' → one-time purchase, 'plan' → needs active subscription

  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured:  { type: DataTypes.BOOLEAN, defaultValue: false },

  // Stats
  totalSales:    { type: DataTypes.INTEGER, defaultValue: 0 },
  totalDownloads:{ type: DataTypes.INTEGER, defaultValue: 0 },
  totalViews:    { type: DataTypes.INTEGER, defaultValue: 0 },

  // Language
  language:    { type: DataTypes.STRING(50), defaultValue: 'English' },

  createdBy:   { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'ebooks',
  indexes: [
    { unique: true, fields: ['slug'] },
    { fields: ['isActive'] },
    { fields: ['isFeatured'] },
    { fields: ['category'] },
  ],
});

module.exports = EBook;
