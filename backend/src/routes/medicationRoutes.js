const express = require('express');
const { check } = require('express-validator');
const medicationController = require('../controllers/medicationController');
const auth = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/medications
// @desc    Get all medications
// @access  Private
router.get('/', medicationController.getMedications);

// @route   GET /api/medications/:id
// @desc    Get single medication
// @access  Private
router.get('/:id', medicationController.getMedication);

// @route   POST /api/medications
// @desc    Create a medication
// @access  Private
router.post(
  '/',
  [
    check('name', 'Name is required').notEmpty(),
    check('dose', 'Dose is required').notEmpty(),
    check('frequency', 'Frequency must be a number').isInt({ min: 1 }),
    check('times', 'Times must be an array of time strings').isArray(),
    check('startDate', 'Start date is required').isISO8601().toDate(),
    check('endDate', 'End date must be a valid date').optional({ nullable: true }).isISO8601().toDate(),
    check('categoryId', 'Category ID must be a number').optional({ nullable: true }).isInt()
  ],
  medicationController.createMedication
);

// @route   PUT /api/medications/:id
// @desc    Update a medication
// @access  Private
router.put(
  '/:id',
  [
    check('name', 'Name is required').notEmpty(),
    check('dose', 'Dose is required').notEmpty(),
    check('frequency', 'Frequency must be a number').isInt({ min: 1 }),
    check('times', 'Times must be an array of time strings').isArray(),
    check('startDate', 'Start date is required').isISO8601().toDate(),
    check('endDate', 'End date must be a valid date').optional({ nullable: true }).isISO8601().toDate(),
    check('categoryId', 'Category ID must be a number').optional({ nullable: true }).isInt()
  ],
  medicationController.updateMedication
);

// @route   DELETE /api/medications/:id
// @desc    Delete a medication
// @access  Private
router.delete('/:id', medicationController.deleteMedication);

module.exports = router; 