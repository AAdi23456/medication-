const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const errorHandler = require('./middlewares/errorHandler');
const session = require('express-session');
const path = require('path');

// Routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const doseLogRoutes = require('./routes/doseLogRoutes');
// Google routes temporarily disabled
// const googleRoutes = require('./routes/googleRoutes');

// Load env variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Configure session for Google OAuth
app.use(session({
  secret: process.env.JWT_SECRET || 'medication_tracker_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/dose-logs', doseLogRoutes);
// Google routes temporarily disabled
// app.use('/api/google', googleRoutes);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Set port - use only .env PORT value
const PORT = process.env.PORT || 5000;

// Start server and connect to database
const startServer = async () => {
  try {
    // Sync database models
    await sequelize.sync();
    console.log('Database connected');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer(); 