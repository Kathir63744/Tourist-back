require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testEmailConnections, sendBookingConfirmation, sendAdminNotification } = require('./utils/hybridEmailService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Calculate price function
const calculatePrice = (bookingData, basePrice) => {
  const { checkIn, checkOut, guests } = bookingData;
  
  const nights = Math.ceil(
    (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
  );
  
  const roomBasePrice = basePrice * guests.rooms * nights;
  const maxAdultsPerRoom = 2;
  const adultsPerRoom = Math.ceil(guests.adults / guests.rooms);
  const extraAdultsPerRoom = Math.max(0, adultsPerRoom - maxAdultsPerRoom);
  const extraAdultsCharge = extraAdultsPerRoom > 0 ? 
    extraAdultsPerRoom * 800 * nights * guests.rooms : 0;
  
  const subtotal = roomBasePrice + extraAdultsCharge;
  const gst = subtotal * 0.18;
  const totalAmount = Math.round(subtotal + gst);

  return {
    basePrice: Math.round(roomBasePrice),
    extraAdultsCharge: Math.round(extraAdultsCharge),
    nights,
    rooms: guests.rooms,
    subtotal: Math.round(subtotal),
    gst: Math.round(gst),
    totalAmount
  };
};

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const results = await testEmailConnections();
    res.json({
      success: true,
      message: 'Email services test complete',
      results,
      activeServices: {
        resend: !!process.env.RESEND_API_KEY,
        gmail: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create booking endpoint
app.post('/api/bookings', async (req, res) => {
  try {
    console.log('\n📝 NEW BOOKING REQUEST');
    console.log('=' .repeat(50));
    
    const { resortId, resortName, roomType, location, checkIn, checkOut, guests, customer, basePrice } = req.body;

    // Basic validation
    if (!checkIn || !checkOut || !guests || !customer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        error: 'Check-out must be after check-in'
      });
    }

    // Calculate price
    const priceBreakdown = calculatePrice({ checkIn, checkOut, guests }, basePrice || 2603);
    
    // Generate booking reference
    const bookingReference = `HILL${Date.now().toString().slice(-8)}`;
    
    // Prepare booking data
    const bookingData = {
      resortId: resortId || '1',
      resortName: resortName || 'HillEscape Resort',
      roomType: roomType || 'Deluxe Room',
      location: location || 'Valparai',
      checkIn,
      checkOut,
      guests,
      customer,
      basePrice: basePrice || 2603,
      totalAmount: priceBreakdown.totalAmount,
      priceBreakdown,
      bookingReference,
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    };

    console.log('✅ Price calculated: ₹' + priceBreakdown.totalAmount);
    console.log('📧 Booking reference:', bookingReference);

    // Send email to customer
    const emailResult = await sendBookingConfirmation(bookingData);
    
    // Send admin notification
    await sendAdminNotification(bookingData);

    // Return success response
    const response = {
      success: true,
      message: emailResult.testMode 
        ? 'Booking received! Check console for details.' 
        : 'Booking confirmed! Check your email.',
      data: {
        bookingReference,
        totalAmount: priceBreakdown.totalAmount,
        email: {
          sent: emailResult.success,
          service: emailResult.service,
          testMode: emailResult.testMode || false
        }
      }
    };

    console.log('=' .repeat(50));
    console.log('✅ Booking processed successfully\n');
    
    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HillEscape Booking API',
    timestamp: new Date().toISOString()
  });
});

// Welcome
app.get('/', (req, res) => {
  res.json({
    message: 'HillEscape Resort Booking API',
    endpoints: {
      createBooking: 'POST /api/bookings',
      testEmail: 'GET /api/test-email',
      health: 'GET /api/health'
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;

// Test email connections on startup
testEmailConnections().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
    console.log(`📧 Test email: http://localhost:${PORT}/api/test-email`);
    console.log(`💳 Make booking: POST http://localhost:${PORT}/api/bookings`);
  });
});