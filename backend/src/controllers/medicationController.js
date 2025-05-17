const { validationResult } = require('express-validator');
const { Medication, Category } = require('../models');

// Get all medications for user
exports.getMedications = async (req, res, next) => {
  try {
    const medications = await Medication.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });

    res.json({ medications });
  } catch (error) {
    next(error);
  }
};

// Get single medication
exports.getMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    res.json({ medication });
  } catch (error) {
    next(error);
  }
};

// Create medication
exports.createMedication = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, dose, frequency, times, startDate, endDate, categoryId } = req.body;

    // Check if category exists and belongs to user if provided
    if (categoryId) {
      const category = await Category.findOne({
        where: {
          id: categoryId,
          userId: req.user.id
        }
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }

    const medication = await Medication.create({
      name,
      dose,
      frequency,
      times,
      startDate,
      endDate,
      categoryId,
      userId: req.user.id
    });

    // Fetch with category included
    const newMedication = await Medication.findByPk(medication.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json({
      message: 'Medication created successfully',
      medication: newMedication
    });
  } catch (error) {
    next(error);
  }
};

// Update medication
exports.updateMedication = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, dose, frequency, times, startDate, endDate, categoryId } = req.body;

    const medication = await Medication.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Check if category exists and belongs to user if provided
    if (categoryId) {
      const category = await Category.findOne({
        where: {
          id: categoryId,
          userId: req.user.id
        }
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }

    // Update medication
    medication.name = name;
    medication.dose = dose;
    medication.frequency = frequency;
    medication.times = times;
    medication.startDate = startDate;
    medication.endDate = endDate;
    medication.categoryId = categoryId;

    await medication.save();

    // Fetch updated medication with category
    const updatedMedication = await Medication.findByPk(medication.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      message: 'Medication updated successfully',
      medication: updatedMedication
    });
  } catch (error) {
    next(error);
  }
};

// Delete medication
exports.deleteMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    await medication.destroy();

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    next(error);
  }
}; 