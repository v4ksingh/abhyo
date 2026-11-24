const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), unique: true, allowNull: true, validate: { isEmail: true } },
  mobile: { type: DataTypes.STRING(15), unique: true, allowNull: true },
  password: { type: DataTypes.STRING(255), allowNull: true },
  role: { type: DataTypes.ENUM('superadmin', 'admin', 'accountant', 'content_manager', 'teacher', 'institute', 'student', 'instructor'), defaultValue: 'student' },
  // OTP fields
  otp: { type: DataTypes.STRING(6), allowNull: true },
  otpExpiry: { type: DataTypes.DATE, allowNull: true },
  otpAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  // Status
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  isMobileVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  institutePremiumBlocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  // Security Locking
  failedLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockUntil: { type: DataTypes.DATE, allowNull: true },
  // Profile
  avatar: { type: DataTypes.STRING(500), allowNull: true },
  language: { type: DataTypes.ENUM('en', 'hi'), defaultValue: 'en' },
  state: { type: DataTypes.STRING(100), allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: true },
  casteCategory: { type: DataTypes.ENUM('GEN', 'OBC', 'SC', 'ST', 'EWS', 'Other'), allowNull: true },
  isOlympiadUser: { type: DataTypes.BOOLEAN, defaultValue: false },
  
  // Student Subscription
  studentSubscriptionPlan: { type: DataTypes.STRING(100), defaultValue: 'free' }, // stores plan ID (UUID) or 'free'
  studentSubscriptionStatus: { type: DataTypes.ENUM('active', 'trial', 'expired', 'cancelled'), defaultValue: 'expired' },
  studentSubscriptionEndDate: { type: DataTypes.DATE, allowNull: true },
  // Password reset
  resetPasswordToken: { type: DataTypes.STRING(255), allowNull: true },
  resetPasswordExpiry: { type: DataTypes.DATE, allowNull: true },
  // Refresh token
  refreshToken: { type: DataTypes.TEXT, allowNull: true },
  // Foreign key set dynamically
  instituteId: { type: DataTypes.UUID, allowNull: true },
  instituteApprovalStatus: { type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'), defaultValue: 'none' },
  lastLogin: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.otp;
  delete values.otpExpiry;
  delete values.resetPasswordToken;
  delete values.refreshToken;
  delete values.failedLoginAttempts;
  delete values.lockUntil;
  return values;
};

module.exports = User;
