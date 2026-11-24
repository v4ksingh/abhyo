const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Page = sequelize.define('Page', {
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    metaDescription: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
});

module.exports = Page;
