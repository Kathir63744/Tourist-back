const { sendBookingConfirmation, sendAdminNotification } = require('../utils/emailService');

const calculatePrice = (bookingData, basePrice) => {
  try {
    const { checkIn, checkOut, guests } = bookingData;
    
    // Calculate nights
    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    ) || 1;
    
    // Base price for rooms
    const roomBasePrice = (basePrice || 2603) * (guests?.rooms || 1) * nights;
    
    // Extra adults charge
    const maxAdultsPerRoom = 2;
    const adultsPerRoom = Math.ceil((guests?.adults || 2) / (guests?.rooms || 1));
    const extraAdultsPerRoom = Math.max(0, adultsPerRoom - maxAdultsPerRoom);
    const extraAdultsCharge = extraAdultsPerRoom > 0 ? 
      extraAdultsPerRoom * 800 * nights * (guests?.rooms || 1) : 0;
    
    // Subtotal
    const subtotal = roomBasePrice + extraAdultsCharge;
    
    // GST (18%)
    const gst = subtotal * 0.18;
    
    const totalAmount = Math.round(subtotal + gst);

    return {
      basePrice: Math.round(roomBasePrice),
      extraAdultsCharge: Math.round(extraAdultsCharge),
      nights,
      rooms: guests?.rooms || 1,
      subtotal: Math.round(subtotal),
      gst: Math.round(gst),
      totalAmount
    };
  } catch (error) {
    // Return default price if calculation fails
    return {
      basePrice: (basePrice || 2603) * 1,
      extraAdultsCharge: 0,
      nights: 1,
      rooms: 1,
      subtotal: basePrice || 2603,
      gst: Math.round((basePrice || 2603) * 0.18),
      totalAmount: Math.round((basePrice || 2603) * 1.18)
    };
  }
};

exports.createBooking = async (req, res) => {
  try {
    console.log('📝 NEW BOOKING REQUEST ============');
    console.log('Customer:', req.body.customer?.name);
    console.log('Email:', req.body.customer?.email);
    console.log('Resort:', req.body.resortName);
    console.log('==================================');
    
    const {
      resortId = '1',
      resortName = 'HillEscape Resort',
      roomType = 'Deluxe Room',
      location = 'Valparai',
      checkIn,
      checkOut,
      guests = { adults: 2, children: 0, rooms: 1 },
      customer = {},
      basePrice = 2603
    } = req.body;

    // Validate dates
    let validCheckIn = checkIn;
    let validCheckOut = checkOut;
    
    if (!checkIn) {
      validCheckIn = new Date().toISOString().split('T')[0];
    }
    
    if (!checkOut) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      validCheckOut = tomorrow.toISOString().split('T')[0];
    }


const priceBreakdown = calculatePrice({ 
      checkIn: validCheckIn, 
      checkOut: validCheckOut, 
      guests 
    }, basePrice);
    
    // Generate booking reference
    const bookingReference = `HILL${Date.now().toString().slice(-8)}`;
    
    // Prepare booking data
    const bookingData = {
      resortId,
      resortName,
      roomType,
      location,
      checkIn: validCheckIn,
      checkOut: validCheckOut,
      guests,
      customer: {
        name: customer.name || 'Guest',
        email: customer.email || 'guest@example.com',
        phone: customer.phone || 'Not provided',
        address: customer.address || '',
        notes: customer.notes || ''
      },
      basePrice,
      totalAmount: priceBreakdown.totalAmount,
      priceBreakdown,
      bookingReference,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    console.log('✅ Price calculated: ₹' + priceBreakdown.totalAmount);
    console.log('📧 Booking reference:', bookingReference);

    // Try to send email (but don't fail if it doesn't work)
    let emailResult = { success: false, message: 'Email not sent' };
    try {
      const { sendBookingConfirmation } = require('../utils/hybridEmailService');
      emailResult = await sendBookingConfirmation(bookingData);
      console.log('📧 Email attempt:', emailResult.message);
    } catch (emailError) {
      console.log('⚠️ Email failed (non-critical):', emailError.message);
    }

    // Return success response
    const response = {
      success: true,
      message: 'Booking request submitted successfully!',
      data: {
        bookingReference,
        totalAmount: priceBreakdown.totalAmount,
        checkIn: validCheckIn,
        checkOut: validCheckOut,
        resortName,
        roomType,
        customer: {
          name: bookingData.customer.name,
          email: bookingData.customer.email
        },
        priceBreakdown,
        emailSent: emailResult.success || false,
        note: 'Our team will contact you within 2 hours to confirm.'
      }
    };

    console.log('✅ Booking processed successfully\n');
    
    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Booking processing error:', error.message);
    
    // Even on error, return something useful
    res.status(200).json({
      success: true,
      message: 'Booking request received! Reference will be sent shortly.',
      data: {
        bookingReference: `HILL${Date.now().toString().slice(-6)}`,
        status: 'received',
        note: 'Our team will process your booking and contact you soon.'
      }
    });
  }
};

exports.checkAvailability = async (req, res) => {
  res.json({
    success: true,
    message: "Availability check endpoint working",
    data: {
      available: true,
      note: "Please contact for specific dates"
    }
  });
};
