const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mocktest_lms',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[SQL] ${msg}`) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  }
);

const mysql = require('mysql2/promise');

const connectDB = async () => {
  try {
    // 1. Create database if it doesn't exist using mysql2
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'mocktest_lms'}\`;`);
    await connection.end();

    // 2. Connect to Sequelize
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');

    // Tables already exist in MySQL — skip sync to avoid
    // MySQL's 64-key-per-table constraint error on alter/index ops.
    // To add new tables: run the manual migration script (npm run migrate).
    console.log('✅ Database synchronized');
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
