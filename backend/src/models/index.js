const User = require('./User');
const Category = require('./Category');
const Medication = require('./Medication');
const DoseLog = require('./DoseLog');
const sequelize = require('../config/database');

// User -> Category (One-to-Many)
User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId' });

// User -> Medication (One-to-Many)
User.hasMany(Medication, { foreignKey: 'userId', as: 'medications' });
Medication.belongsTo(User, { foreignKey: 'userId' });

// Category -> Medication (One-to-Many)
Category.hasMany(Medication, { foreignKey: 'categoryId', as: 'medications' });
Medication.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// User -> DoseLog (One-to-Many)
User.hasMany(DoseLog, { foreignKey: 'userId', as: 'doseLogs' });
DoseLog.belongsTo(User, { foreignKey: 'userId' });

// Medication -> DoseLog (One-to-Many)
Medication.hasMany(DoseLog, { foreignKey: 'medicationId', as: 'doseLogs' });
DoseLog.belongsTo(Medication, { foreignKey: 'medicationId', as: 'medication' });

module.exports = {
  sequelize,
  User,
  Category,
  Medication,
  DoseLog
}; 