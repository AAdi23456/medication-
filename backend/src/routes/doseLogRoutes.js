const express = require('express');
const { check } = require('express-validator');
const doseLogController = require('../controllers/doseLogController');
const auth = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/dose-logs
// @desc    Get all dose logs for a user
// @access  Private
router.get('/', doseLogController.getDoseLogs);

// @route   GET /api/dose-logs/schedule
// @desc    Get today's medication schedule
// @access  Private
router.get('/schedule', doseLogController.getTodaySchedule);

// @route   GET /api/dose-logs/weekly-schedule
// @desc    Get medication schedule for a week
// @access  Private
router.get('/weekly-schedule', doseLogController.getWeeklySchedule);

// @route   POST /api/dose-logs
// @desc    Log a dose
// @access  Private
router.post(
  '/',
  [
    check('medicationId', 'Medication ID is required').isInt(),
    check('scheduledTime', 'Scheduled time is required').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    check('status', 'Status must be taken, missed, or skipped').optional().isIn(['taken', 'missed', 'skipped'])
  ],
  doseLogController.logDose
);

// @route   GET /api/dose-logs/stats
// @desc    Get adherence statistics
// @access  Private
router.get('/stats', doseLogController.getAdherenceStats);

// @route   GET /api/dose-logs/export/pdf
// @desc    Generate and download PDF report
// @access  Private
router.get('/export/pdf', doseLogController.generatePdfReport);

// @route   GET /api/dose-logs/export/csv
// @desc    Generate and download CSV export
// @access  Private
router.get('/export/csv', doseLogController.generateCsvExport);

module.exports = router; 