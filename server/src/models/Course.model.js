const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(300), unique: true, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  thumbnail: { type: DataTypes.STRING(500), allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: false },
  category: { type: DataTypes.STRING(100), allowNull: true },
  instructorName: { type: DataTypes.STRING(150), allowNull: true },
  instructorBio: { type: DataTypes.TEXT, allowNull: true },
  instructorId: { type: DataTypes.UUID, allowNull: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  createdBy: { type: DataTypes.UUID, allowNull: false },
  
  // Extended Features
  seats: { type: DataTypes.INTEGER, allowNull: true },
  recordedClasses: { type: DataTypes.INTEGER, allowNull: true },
  liveClasses: { type: DataTypes.INTEGER, allowNull: true },
  courseDuration: { type: DataTypes.STRING(100), allowNull: true },
  salientFeatures: { type: DataTypes.JSON, allowNull: true },
  productHighlights: { type: DataTypes.JSON, allowNull: true },
  examsCovered: { type: DataTypes.JSON, allowNull: true },
  faqs: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'courses',
});

module.exports = Course;
