const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EnrollmentRequest = sequelize.define('EnrollmentRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  instituteId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'enrollment_requests',
  indexes: [
    { fields: ['studentId'] },
    { fields: ['courseId'] },
    { fields: ['instituteId'] },
    { fields: ['status'] },
    { unique: true, fields: ['studentId', 'courseId'] }
  ],
});

module.exports = EnrollmentRequest;
