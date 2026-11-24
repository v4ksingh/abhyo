const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subject: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  targetGroup: {
    type: DataTypes.ENUM('all', 'students', 'institutes', 'teachers', 'specific', 'course_students', 'batch_students'),
    defaultValue: 'specific',
  },
  recipientCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    defaultValue: 'pending',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // FK
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  instituteId: {
    type: DataTypes.UUID,
    allowNull: true, // If sent by an institute admin
  }
}, {
  tableName: 'email_logs',
  timestamps: true,
});

module.exports = EmailLog;
