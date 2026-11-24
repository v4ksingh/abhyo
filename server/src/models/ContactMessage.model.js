const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactMessage = sequelize.define('ContactMessage', {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('unread', 'read', 'replied'),
      defaultValue: 'unread'
    }
});

module.exports = ContactMessage;
