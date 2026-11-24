const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentFee = sequelize.define('StudentFee', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  totalFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  paidAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  dueAmount: { 
    type: DataTypes.VIRTUAL,
    get() {
      return this.totalFee - this.paidAmount;
    }
  },
  status: {
    type: DataTypes.ENUM('paid', 'partial', 'unpaid'),
    defaultValue: 'unpaid'
  }
}, {
  tableName: 'student_fees',
  indexes: [
    { fields: ['studentId'] },
    { fields: ['instituteId'] },
    { fields: ['status'] },
  ],
  hooks: {
    beforeSave: (fee) => {
      if (fee.paidAmount >= fee.totalFee) {
        fee.status = 'paid';
      } else if (fee.paidAmount > 0) {
        fee.status = 'partial';
      } else {
        fee.status = 'unpaid';
      }
    }
  }
});

module.exports = StudentFee;
