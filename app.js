// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const bookingRoutes = require('./routes/bookingRoutes');
const resortRoutes = require('./routes/resortRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

const emailRoutes = require('./routes/emailRoutes');
app.use('/api/email', emailRoutes);

// Basic middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/resorts', resortRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Resort Booking API is running',
    timestamp: new Date().toISOString()
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to HillEscape Resort Booking API',
    version: '1.0.0',
    endpoints: {
      bookings: '/api/bookings',
      resorts: '/api/resorts',
      contact: '/api/contact',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔴 Error:', err.stack);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = app;

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
