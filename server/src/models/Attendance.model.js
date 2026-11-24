const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
    defaultValue: 'present'
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  batchId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  instituteId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  markedBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['date', 'studentId', 'batchId']
    }
  ]
});

module.exports = Attendance;
