const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Create booking
router.post('/', bookingController.createBooking);

// Check availability
router.get('/check/availability', bookingController.checkAvailability);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Booking API is working',
    endpoints: {
      create: 'POST /api/bookings',
      check: 'GET /api/bookings/check/availability'
    }
  });
});

module.exports = router;