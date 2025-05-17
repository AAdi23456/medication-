const express = require('express');
const googleController = require('../controllers/googleController');
const auth = require('../middlewares/auth');

const router = express.Router();

// @route   GET /api/google/auth-url
// @desc    Get Google auth URL
// @access  Private
router.get('/auth-url', auth, googleController.getAuthUrl);

// @route   GET /api/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
router.get('/callback', googleController.handleCallback);

// @route   POST /api/google/sync-calendar
// @desc    Sync medications to Google Calendar
// @access  Private
router.post('/sync-calendar', auth, googleController.syncToCalendar);

module.exports = router; 