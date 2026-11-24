const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadRegistration = sequelize.define('OlympiadRegistration', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  rollNumber:   { type: DataTypes.STRING(30), allowNull: true },  // auto-generated after payment
  classSelected:{ type: DataTypes.INTEGER, allowNull: false, validate: { min: 6, max: 12 } },

  // Student Details
  dob:          { type: DataTypes.STRING(30), allowNull: true },
  gender:       { type: DataTypes.STRING(20), allowNull: true },
  fatherName:   { type: DataTypes.STRING(150), allowNull: true },
  address:      { type: DataTypes.TEXT, allowNull: true },
  board:        { type: DataTypes.STRING(100), allowNull: true },
  medium:       { type: DataTypes.STRING(50), allowNull: true },

  // School Details
  schoolType:    { type: DataTypes.STRING(20), defaultValue: 'private' }, // 'govt' or 'private'
  schoolName:    { type: DataTypes.STRING(255), allowNull: true },
  schoolAddress: { type: DataTypes.TEXT, allowNull: true },

  // Identity Document & Admin Verification
  documentType:    { type: DataTypes.STRING(100), allowNull: true },
  documentNumber:  { type: DataTypes.STRING(100), allowNull: true },
  documentUrl:     { type: DataTypes.STRING(500), allowNull: true },
  schoolIdCardUrl: { type: DataTypes.STRING(500), allowNull: true },
  studentPhotoUrl: { type: DataTypes.STRING(500), allowNull: true },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  verificationRemarks: { type: DataTypes.TEXT, allowNull: true },
  verifiedAt:   { type: DataTypes.DATE, allowNull: true },
  verifiedBy:   { type: DataTypes.CHAR(36), allowNull: true },

  // Payment
  paymentId:    { type: DataTypes.UUID, allowNull: true },   // FK → payments.id
  paymentStatus:{ type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
  amountPaid:   { type: DataTypes.FLOAT, defaultValue: 0 },

  // Admit card
  admitCardGenerated: { type: DataTypes.BOOLEAN, defaultValue: false },
  admitCardUrl: { type: DataTypes.STRING(500), allowNull: true },

  // Status
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
    defaultValue: 'pending',
  },

  // FKs
  olympiadId: { type: DataTypes.UUID, allowNull: false },
  userId:     { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'olympiad_registrations',
  indexes: [
    { fields: ['olympiadId'] },
    { fields: ['userId'] },
    { fields: ['paymentStatus'] },
    { unique: true, fields: ['olympiadId', 'userId'] },
    { fields: ['rollNumber'] },
  ],
});

module.exports = OlympiadRegistration;
