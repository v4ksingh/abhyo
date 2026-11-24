const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeeStructure = sequelize.define('FeeStructure', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  courseName: { type: DataTypes.STRING(255), allowNull: false },
  totalFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  installmentType: { 
    type: DataTypes.ENUM('lumpsum', 'monthly', 'quarterly', 'half_yearly'), 
    defaultValue: 'lumpsum' 
  },
}, {
  tableName: 'fee_structures',
  indexes: [
    { fields: ['instituteId'] },
  ],
});

module.exports = FeeStructure;
