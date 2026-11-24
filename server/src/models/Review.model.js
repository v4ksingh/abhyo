const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  instituteId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  rating: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  title: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Instructor reply
  reply: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  repliedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  repliedById: {
    type: DataTypes.UUID,
    allowNull: true
  },
  // Helpful votes
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Moderation
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true  // auto-approve; set to false if you want manual review
  },
  isHidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Track who voted helpful (stored as JSON array of userIds)
  helpfulVoters: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['courseId', 'userId'] }  // one review per student per course
  ]
});

module.exports = Review;
