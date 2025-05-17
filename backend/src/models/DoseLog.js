const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DoseLog = sequelize.define('DoseLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  medicationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Medications',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  scheduledTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  takenAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('taken', 'missed', 'skipped'),
    defaultValue: 'taken'
  },
  wasLate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

module.exports = DoseLog; 