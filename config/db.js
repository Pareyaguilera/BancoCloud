require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'banco-mysql-privada.ckngoimkzp1t.us-east-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'bancocl',
  password: process.env.DB_PASSWORD || 'mybanco12',
  database: process.env.DB_NAME || 'bdbancoprivada',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
