const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  discountType: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false, defaultValue: 'percentage' },
  discountValue: { type: DataTypes.FLOAT, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  maxUses: { type: DataTypes.INTEGER, allowNull: true },
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  validFrom: { type: DataTypes.DATE, allowNull: true },
  validUntil: { type: DataTypes.DATE, allowNull: true },
  applicablePlans: { type: DataTypes.JSON, allowNull: true, defaultValue: [] }, // Array of Plan IDs or empty for all
}, {
  tableName: 'coupons',
});

module.exports = Coupon;
