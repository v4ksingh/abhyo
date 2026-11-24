const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  // Razorpay fields
  razorpayOrderId: { type: DataTypes.STRING(100), allowNull: true },
  razorpayPaymentId: { type: DataTypes.STRING(100), allowNull: true },
  razorpaySignature: { type: DataTypes.STRING(300), allowNull: true },
  // Amount in INR (not paise)
  amount: { type: DataTypes.FLOAT, allowNull: false },
  currency: { type: DataTypes.STRING(5), defaultValue: 'INR' },
  status: {
    type: DataTypes.ENUM('pending', 'captured', 'failed', 'refunded', 'success'),
    defaultValue: 'pending',
  },
  type: {
    type: DataTypes.ENUM('test_purchase', 'institute_subscription', 'one_time', 'fee_payment'),
    defaultValue: 'one_time',
  },
  paymentMode: {
    type: DataTypes.ENUM('online', 'cash', 'upi', 'bank'),
    defaultValue: 'online',
  },
  transactionId: { type: DataTypes.STRING(255), allowNull: true },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.STRING(500), allowNull: true },
  // FKs
  userId: { type: DataTypes.UUID, allowNull: false }, // Equivalent to student_id
  instituteId: { type: DataTypes.UUID, allowNull: true },
  testId: { type: DataTypes.UUID, allowNull: true },
  ebookId: { type: DataTypes.UUID, allowNull: true },   // for ebook one-time purchases
  couponCode: { type: DataTypes.STRING(50), allowNull: true },

}, {
  tableName: 'payments',
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['razorpayOrderId'] },
  ],
});

module.exports = Payment;
