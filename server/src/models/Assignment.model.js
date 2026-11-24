const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  fileUrl: { type: DataTypes.STRING(500), allowNull: true },
  deadline: { type: DataTypes.DATE, allowNull: true },
  maxPoints: { type: DataTypes.INTEGER, defaultValue: 100 },
  courseId: { type: DataTypes.UUID, allowNull: true },
  batchId: { type: DataTypes.UUID, allowNull: false },
  instituteId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'assignments',
});

const AssignmentSubmission = sequelize.define('AssignmentSubmission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  assignmentId: { type: DataTypes.UUID, allowNull: false },
  fileUrl: { type: DataTypes.STRING(500), allowNull: false },
  studentNotes: { type: DataTypes.TEXT, allowNull: true },
  grade: { type: DataTypes.STRING(20), allowNull: true },
  points: { type: DataTypes.INTEGER, allowNull: true },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  gradedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'assignment_submissions',
});

module.exports = { Assignment, AssignmentSubmission };
