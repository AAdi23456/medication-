const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const { Medication, Category } = require('../models');

// Create OAuth client
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate authentication URL
exports.getAuthUrl = (req, res) => {
  // Set up scope for Google Calendar
  const scopes = ['https://www.googleapis.com/auth/calendar'];

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: req.user.id.toString() // Store user ID in state
  });

  res.json({ authUrl });
};

// Handle OAuth callback
exports.handleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is missing' });
    }
    
    // Get user ID from state
    const userId = parseInt(state);
    
    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    
    // Store tokens (in a real app, save these securely to the user's record in DB)
    req.session.googleTokens = tokens;
    req.session.googleUserId = userId;
    
    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/calendar-sync-success`);
  } catch (error) {
    next(error);
  }
};

// Sync medications to Google Calendar
exports.syncToCalendar = async (req, res, next) => {
  try {
    const tokens = req.session.googleTokens;
    
    if (!tokens) {
      return res.status(401).json({ message: 'Not authorized with Google. Please authenticate first.' });
    }
    
    // Set credentials
    oAuth2Client.setCredentials(tokens);
    
    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    
    // Get all active medications for user
    const medications = await Medication.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Category, as: 'category' }
      ]
    });
    
    // Create events for each medication
    const results = [];
    
    for (const medication of medications) {
      // Skip medications with past end dates
      if (medication.endDate && new Date(medication.endDate) < new Date()) {
        continue;
      }
      
      // Create event for each time
      for (const time of medication.times) {
        const [hours, minutes] = time.split(':').map(Number);
        
        // Create start date (today at the specified time)
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        
        // If start date is in the past today, skip to tomorrow
        if (startDate < new Date()) {
          startDate.setDate(startDate.getDate() + 1);
        }
        
        // End date is 30 minutes after start
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + 30);
        
        // Create recurrence rule (daily until medication end date)
        let recurrence = ['RRULE:FREQ=DAILY'];
        if (medication.endDate) {
          recurrence[0] += `;UNTIL=${medication.endDate.replace(/-/g, '')}T235959Z`;
        }
        
        // Category name for event description
        const categoryName = medication.category ? `Category: ${medication.category.name}` : '';
        
        // Create event
        const event = {
          summary: `Take ${medication.name} (${medication.dose})`,
          description: `Medication reminder\n${categoryName}`,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'America/New_York' // Should be dynamic based on user's timezone
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'America/New_York'
          },
          recurrence,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 10 }
            ]
          }
        };
        
        try {
          const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
          });
          
          results.push({
            medication: medication.name,
            time,
            success: true,
            eventId: response.data.id
          });
        } catch (error) {
          results.push({
            medication: medication.name,
            time,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    res.json({
      message: 'Medications synced to Google Calendar',
      results
    });
  } catch (error) {
    next(error);
  }
}; 