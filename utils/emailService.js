const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For testing, just return a mock transporter
  return {
    sendMail: async (mailOptions) => {
      console.log('📧 WOULD SEND EMAIL:');
      console.log('   To:', mailOptions.to);
      console.log('   Subject:', mailOptions.subject);
      console.log('   From:', mailOptions.from);
      return { messageId: 'test-message-id' };
    },
    verify: async () => {
      console.log('✅ Email service ready (test mode)');
      return true;
    }
  };
};

const transporter = createTransporter();

// Test email connection
exports.testEmailConnection = async () => {
  try {
    console.log('✅ Email will use test configuration');
    return { success: true, message: 'Using test email configuration', testMode: true };
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return { success: true, message: 'Using test mode', testMode: true };
  }
};

// Send booking confirmation
exports.sendBookingConfirmation = async (bookingData) => {
  try {
    const nights = Math.ceil(
      (new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24)
    );

    const mailOptions = {
      from: `"HillEscape Resorts" <noreply@hillescape.com>`,
      to: bookingData.customer.email,
      subject: `Booking Request #${bookingData.bookingReference}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0d9488, #059669); color: white; padding: 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .booking-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; background: #ecfdf5; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Request Received</h1>
              <p>HillEscape Luxury Resorts</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${bookingData.customer.name}</strong>,</p>
              <p>Thank you for choosing HillEscape! Your booking request has been received.</p>
              
              <div class="booking-info">
                <h3>Booking Summary</h3>
                <table>
                  <tr>
                    <td><strong>Booking Reference:</strong></td>
                    <td><strong style="color: #059669;">${bookingData.bookingReference}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Resort:</strong></td>
                    <td>${bookingData.resortName}</td>
                  </tr>
                  <tr>
                    <td><strong>Room Type:</strong></td>
                    <td>${bookingData.roomType}</td>
                  </tr>
                  <tr>
                    <td><strong>Check-in:</strong></td>
                    <td>${new Date(bookingData.checkIn).toLocaleDateString('en-IN')} (2:00 PM)</td>
                  </tr>
                  <tr>
                    <td><strong>Check-out:</strong></td>
                    <td>${new Date(bookingData.checkOut).toLocaleDateString('en-IN')} (11:00 AM)</td>
                  </tr>
                  <tr>
                    <td><strong>Duration:</strong></td>
                    <td>${nights} night(s)</td>
                  </tr>
                  <tr>
                    <td><strong>Rooms:</strong></td>
                    <td>${bookingData.guests.rooms}</td>
                  </tr>
                  <tr>
                    <td><strong>Guests:</strong></td>
                    <td>${bookingData.guests.adults} Adult(s), ${bookingData.guests.children || 0} Child(ren)</td>
                  </tr>
                  <tr class="total">
                    <td><strong>Total Amount:</strong></td>
                    <td>₹${bookingData.totalAmount}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4>⏰ Next Steps</h4>
                <p>Our team will contact you at <strong>${bookingData.customer.phone}</strong> within 2 hours to confirm.</p>
              </div>
              
              <p>Thank you for choosing HillEscape!</p>
              <p><strong>The HillEscape Team</strong></p>
            </div>
            
            <div class="footer">
              <p><strong>HillEscape Luxury Resorts</strong></p>
              <p>📞 +91 98765 43210 | ✉️ support@hillescape.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log('📧 EMAIL DETAILS:');
    console.log('   To:', bookingData.customer.email);
    console.log('   Booking Reference:', bookingData.bookingReference);
    console.log('   Resort:', bookingData.resortName);
    console.log('   Room Type:', bookingData.roomType);
    console.log('   Check-in:', new Date(bookingData.checkIn).toLocaleDateString());
    console.log('   Check-out:', new Date(bookingData.checkOut).toLocaleDateString());
    console.log('   Guests:', bookingData.guests.adults + ' adults, ' + bookingData.guests.children + ' children');
    console.log('   Rooms:', bookingData.guests.rooms);
    console.log('   Total Amount: ₹' + bookingData.totalAmount);
    console.log('   Customer Phone:', bookingData.customer.phone);
    
    // For development, just log the email
    await transporter.sendMail(mailOptions);
    
    return { 
      success: true, 
      message: 'Email logged successfully',
      bookingReference: bookingData.bookingReference,
      testMode: true
    };
    
  } catch (error) {
    console.error('❌ Email error:', error);
    return { 
      success: true, // Return success anyway for development
      error: error.message,
      testMode: true
    };
  }
};

// Send admin notification
exports.sendAdminNotification = async (bookingData) => {
  try {
    console.log('\n📧 ADMIN NOTIFICATION:');
    console.log('   Booking Reference:', bookingData.bookingReference);
    console.log('   Customer:', bookingData.customer.name);
    console.log('   Email:', bookingData.customer.email);
    console.log('   Phone:', bookingData.customer.phone);
    console.log('   Resort:', bookingData.resortName);
    console.log('   Room Type:', bookingData.roomType);
    console.log('   Check-in:', new Date(bookingData.checkIn).toLocaleDateString());
    console.log('   Check-out:', new Date(bookingData.checkOut).toLocaleDateString());
    console.log('   Amount: ₹' + bookingData.totalAmount);
    console.log('   ACTION REQUIRED: Contact customer within 2 hours');
    
    return { success: true, testMode: true };
  } catch (error) {
    console.error('❌ Admin notification error:', error);
    return { success: true, testMode: true };
  }
};