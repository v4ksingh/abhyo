const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlogPost = sequelize.define('BlogPost', {
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    excerpt: {
      type: DataTypes.STRING,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'General'
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    readTime: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
});

module.exports = BlogPost;
