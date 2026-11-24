const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CertificateRequest = sequelize.define('CertificateRequest', {
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
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  mobile: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  certificateUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'certificate_requests',
  timestamps: true,
});

module.exports = CertificateRequest;
