const { validationResult } = require('express-validator');
const { Category } = require('../models');

// Get all categories for user
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']]
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

// Get single category
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    next(error);
  }
};

// Create category
exports.createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const category = await Category.create({
      name,
      userId: req.user.id
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const category = await Category.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = name;
    await category.save();

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// Delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await category.destroy();

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
}; 