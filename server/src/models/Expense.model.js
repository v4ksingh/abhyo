const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  category: { type: DataTypes.STRING(255), allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'expenses',
  indexes: [
    { fields: ['instituteId'] },
    { fields: ['date'] },
  ],
});

module.exports = Expense;
