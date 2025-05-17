const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medication = sequelize.define('Medication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dose: {
    type: DataTypes.STRING,
    allowNull: false
  },
  frequency: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  times: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('times');
      if (rawValue) {
        if (Array.isArray(rawValue)) {
          return rawValue;
        }
        if (typeof rawValue === 'string') {
          try {
            if (rawValue.startsWith('{') && rawValue.endsWith('}')) {
              return rawValue.slice(1, -1).split(',');
            }
            return JSON.parse(rawValue);
          } catch (e) {
            console.error('Error parsing times array', e);
            return [rawValue];
          }
        }
      }
      return [];
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Categories',
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
  }
}, {
  timestamps: true
});

module.exports = Medication; 