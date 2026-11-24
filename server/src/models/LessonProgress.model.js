const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LessonProgress = sequelize.define('LessonProgress', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  courseId: { type: DataTypes.UUID, allowNull: false },
  lessonId: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM('in_progress', 'completed'), defaultValue: 'completed' },
  completedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'lesson_progress',
  indexes: [
    { unique: true, fields: ['userId', 'lessonId'] }
  ]
});

module.exports = LessonProgress;
