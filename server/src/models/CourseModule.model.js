const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CourseModule = sequelize.define('CourseModule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  courseId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'course_modules',
});

module.exports = CourseModule;
