const { sendBookingConfirmation, sendAdminNotification } = require('../utils/emailService');

// Calculate price based on your rules
const calculatePrice = (bookingData, basePrice) => {
  const { checkIn, checkOut, guests } = bookingData;
  
  // Calculate nights
  const nights = Math.ceil(
    (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
  );
  
  if (nights <= 0) {
    throw new Error('Invalid dates');
  }
  
  // Base price for rooms (room rate × rooms × nights)
  const roomBasePrice = basePrice * guests.rooms * nights;
  
  // Calculate extra adults (beyond 2 per room)
  const maxAdultsPerRoom = 2;
  const adultsPerRoom = Math.ceil(guests.adults / guests.rooms);
  const extraAdultsPerRoom = Math.max(0, adultsPerRoom - maxAdultsPerRoom);
  const extraAdultsCharge = extraAdultsPerRoom > 0 ? 
    extraAdultsPerRoom * 800 * nights * guests.rooms : 0;
  
  // Subtotal
  const subtotal = roomBasePrice + extraAdultsCharge;
  
  // GST (18%)
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

// Create booking
exports.createBooking = async (req, res) => {
  try {
    console.log('📝 Creating booking:', req.body);
    
    const {
      resortId,
      resortName,
      roomType,
      location,
      checkIn,
      checkOut,
      guests,
      customer,
      basePrice
    } = req.body;

    // Validate required fields
    const requiredFields = ['resortId', 'roomType', 'checkIn', 'checkOut', 'guests', 'customer'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Check-in date cannot be in the past'
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        error: 'Check-out must be after check-in'
      });
    }

    // Calculate price
    const priceBreakdown = calculatePrice({ checkIn, checkOut, guests }, basePrice);
    
    // Generate booking reference
    const bookingReference = `HILL${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Prepare booking data
    const bookingData = {
      resortId,
      resortName: resortName || `Resort ${resortId}`,
      roomType,
      location: location || 'Valparai, Solaiyur, or Kothagiri',
      checkIn,
      checkOut,
      guests,
      customer,
      basePrice,
      totalAmount: priceBreakdown.totalAmount,
      priceBreakdown,
      bookingReference,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    console.log('✅ Price calculated:', priceBreakdown);
    console.log('📧 Booking reference:', bookingReference);

    // Send emails
    const emailResults = [];
    
    try {
      const customerEmail = await sendBookingConfirmation(bookingData);
      emailResults.push({ to: 'customer', success: customerEmail.success });
    } catch (emailError) {
      console.error('Customer email failed:', emailError);
      emailResults.push({ to: 'customer', success: false });
    }
    
    try {
      const adminEmail = await sendAdminNotification(bookingData);
      emailResults.push({ to: 'admin', success: adminEmail.success });
    } catch (emailError) {
      console.error('Admin email failed:', emailError);
      emailResults.push({ to: 'admin', success: false });
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      data: {
        bookingReference,
        status: 'pending',
        checkIn,
        checkOut,
        totalAmount: priceBreakdown.totalAmount,
        customer: {
          name: customer.name,
          email: customer.email
        },
        priceBreakdown,
        emailsSent: emailResults
      }
    });

  } catch (error) {
    console.error('❌ Booking creation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

exports.checkAvailability = async (req, res) => {
  res.json({
    success: true,
    message: "Availability check working"
  });
};
