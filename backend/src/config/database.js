const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Correct path and remove space after '.env'
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Use DATABASE_URL from .env
const connectionString = process.env.DATABASE_URL;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

module.exports = sequelize;
