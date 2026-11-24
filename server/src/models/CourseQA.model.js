const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CourseQA = sequelize.define('CourseQA', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Who asked
  askedById: {
    type: DataTypes.UUID,
    allowNull: false
  },
  // Who answered
  answeredById: {
    type: DataTypes.UUID,
    allowNull: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  instituteId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  isAnswered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  answeredAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'course_qa',
  timestamps: true
});

module.exports = CourseQA;
