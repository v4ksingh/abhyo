const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CourseMaterial = sequelize.define('CourseMaterial', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  fileUrl: { type: DataTypes.STRING(500), allowNull: false },
  fileType: { type: DataTypes.STRING(50), allowNull: true }, // pdf, doc, etc.
  lessonId: { type: DataTypes.UUID, allowNull: true },
  moduleId: { type: DataTypes.UUID, allowNull: true },
  courseId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'course_materials',
});

module.exports = CourseMaterial;
