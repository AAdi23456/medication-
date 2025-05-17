const express = require('express');
const { check } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const auth = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/categories
// @desc    Get all categories for a user
// @access  Private
router.get('/', categoryController.getCategories);

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Private
router.get('/:id', categoryController.getCategory);

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private
router.post(
  '/',
  [
    check('name', 'Name is required').notEmpty()
  ],
  categoryController.createCategory
);

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private
router.put(
  '/:id',
  [
    check('name', 'Name is required').notEmpty()
  ],
  categoryController.updateCategory
);

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private
router.delete('/:id', categoryController.deleteCategory);

module.exports = router; 