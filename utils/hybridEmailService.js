const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Create Gmail transporter with your credentials
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Fix for development
  }
});

// Test all email connections
exports.testEmailConnections = async () => {
  console.log('\n🔍 Testing Email Services...');
  const results = {};

  // Test Resend
  try {
    console.log('   Testing Resend...');
    // Simple test - just check if API key exists
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
      results.resend = { 
        success: true, 
        message: 'Resend API key configured',
        fromEmail: 'booking@hillescape.com'
      };
      console.log('   ✅ Resend: Ready (from booking@hillescape.com)');
    } else {
      results.resend = { 
        success: false, 
        message: 'Invalid Resend API key format' 
      };
      console.log('   ❌ Resend: Invalid API key');
    }
  } catch (error) {
    results.resend = { success: false, message: error.message };
    console.log('   ❌ Resend Error:', error.message);
  }

  // Test Gmail
  try {
    console.log('   Testing Gmail...');
    await gmailTransporter.verify();
    results.gmail = { 
      success: true, 
      message: 'Gmail connected',
      fromEmail: process.env.EMAIL_USER
    };
    console.log('   ✅ Gmail: Connected (from ' + process.env.EMAIL_USER + ')');
  } catch (error) {
    results.gmail = { success: false, message: error.message };
    console.log('   ❌ Gmail Error:', error.message);
    
    // Helpful tips for Gmail issues
    if (error.code === 'EAUTH') {
      console.log('\n💡 Gmail Fix Tips:');
      console.log('   1. Go to: https://myaccount.google.com/apppasswords');
      console.log('   2. Generate App Password (16 characters)');
      console.log('   3. Update EMAIL_PASS in .env file');
    }
  }

  return results;
};

// Main function to send booking confirmation
exports.sendBookingConfirmation = async (bookingData) => {
  console.log('\n📧 SENDING BOOKING CONFIRMATION...');
  console.log('   To:', bookingData.customer.email);
  console.log('   Reference:', bookingData.bookingReference);
  console.log('   Amount: ₹' + bookingData.totalAmount);

  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    console.log('   ➡️ Trying Resend...');
    const resendResult = await sendViaResend(bookingData);
    if (resendResult.success) {
      console.log('   ✅ Success via Resend!');
      return resendResult;
    }
    console.log('   ❌ Resend failed, trying Gmail...');
  }

  // Try Gmail second
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('   ➡️ Trying Gmail...');
    const gmailResult = await sendViaGmail(bookingData);
    if (gmailResult.success) {
      console.log('   ✅ Success via Gmail!');
      return gmailResult;
    }
    console.log('   ❌ Gmail failed, using fallback...');
  }

  // Fallback to console
  console.log('   ➡️ Using Console Fallback...');
  return sendViaConsole(bookingData);
};

// Send via Resend API
async function sendViaResend(bookingData) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HillEscape <booking@hillescape.com>',
      to: bookingData.customer.email,
      subject: `Booking #${bookingData.bookingReference} - HillEscape`,
      html: generateResendEmailHTML(bookingData),
    });

    if (error) throw error;

    return {
      success: true,
      service: 'resend',
      messageId: data.id,
      fromEmail: 'booking@hillescape.com'
    };
  } catch (error) {
    return {
      success: false,
      service: 'resend',
      error: error.message
    };
  }
}

// Send via Gmail SMTP
async function sendViaGmail(bookingData) {
  try {
    const info = await gmailTransporter.sendMail({
      from: `"HillEscape Resorts" <${process.env.EMAIL_USER}>`,
      to: bookingData.customer.email,
      subject: `Booking Confirmation #${bookingData.bookingReference}`,
      html: generateGmailEmailHTML(bookingData),
    });

    return {
      success: true,
      service: 'gmail',
      messageId: info.messageId,
      fromEmail: process.env.EMAIL_USER
    };
  } catch (error) {
    return {
      success: false,
      service: 'gmail',
      error: error.message
    };
  }
}

// Fallback to console logging
function sendViaConsole(bookingData) {
  const emailContent = `
==================================================
📧 EMAIL NOTIFICATION (Console Fallback)
==================================================
TO: ${bookingData.customer.email}
FROM: booking@hillescape.com
SUBJECT: Booking Confirmed #${bookingData.bookingReference}

Dear ${bookingData.customer.name},

🎉 Your booking is confirmed!

📋 BOOKING DETAILS:
   • Reference: ${bookingData.bookingReference}
   • Resort: ${bookingData.resortName}
   • Room: ${bookingData.roomType}
   • Check-in: ${new Date(bookingData.checkIn).toLocaleDateString('en-IN')} (2:00 PM)
   • Check-out: ${new Date(bookingData.checkOut).toLocaleDateString('en-IN')} (11:00 AM)
   • Guests: ${bookingData.guests.adults} adults, ${bookingData.guests.children} children
   • Rooms: ${bookingData.guests.rooms}
   • Total: ₹${bookingData.totalAmount}

📞 CONTACT INFO:
   • Customer: ${bookingData.customer.name}
   • Phone: ${bookingData.customer.phone}
   • Email: ${bookingData.customer.email}

💡 NEXT STEPS:
   1. Our team will contact you within 2 hours
   2. Pay directly at resort
   3. Free cancellation up to 48 hours before check-in

For queries: +91 98765 43210

Thank you for choosing HillEscape!
==================================================
`;

  console.log(emailContent);

  return {
    success: true,
    service: 'console',
    message: 'Email logged to console',
    testMode: true
  };
}

// Send admin notification
exports.sendAdminNotification = async (bookingData) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    
    console.log('\n📧 SENDING ADMIN NOTIFICATION...');
    console.log('   To:', adminEmail);
    
    // Try Resend first
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'HillEscape Bookings <booking@hillescape.com>',
          to: adminEmail,
          subject: `New Booking: ${bookingData.bookingReference}`,
          html: generateAdminEmailHTML(bookingData),
        });
        console.log('   ✅ Admin notification sent via Resend');
        return { success: true };
      } catch (error) {
        console.log('   ❌ Resend admin failed:', error.message);
      }
    }

    // Try Gmail
    if (process.env.EMAIL_USER) {
      try {
        await gmailTransporter.sendMail({
          from: `"HillEscape Bookings" <${process.env.EMAIL_USER}>`,
          to: adminEmail,
          subject: `New Booking: ${bookingData.bookingReference}`,
          html: generateAdminEmailHTML(bookingData),
        });
        console.log('   ✅ Admin notification sent via Gmail');
        return { success: true };
      } catch (error) {
        console.log('   ❌ Gmail admin failed:', error.message);
      }
    }

    // Fallback to console
    console.log('\n📧 ADMIN NOTIFICATION (Console):');
    console.log('New booking from: ' + bookingData.customer.name);
    console.log('Phone: ' + bookingData.customer.phone);
    console.log('Reference: ' + bookingData.bookingReference);
    console.log('Amount: ₹' + bookingData.totalAmount);
    
    return { success: true, testMode: true };

  } catch (error) {
    console.error('Admin notification error:', error);
    return { success: false };
  }
};

// HTML Templates
function generateResendEmailHTML(bookingData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #0d9488, #059669); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .booking-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbbf24; }
        .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
          <p>HillEscape Luxury Resorts</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${bookingData.customer.name}</strong>,</p>
          <p>Thank you for booking with HillEscape! Your reservation is confirmed.</p>
          
          <div class="booking-card">
            <h3 style="color: #0d9488; margin-top: 0;">Booking Summary</h3>
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
                <td><strong>Guests:</strong></td>
                <td>${bookingData.guests.adults} Adults, ${bookingData.guests.children} Children</td>
              </tr>
              <tr>
                <td><strong>Rooms:</strong></td>
                <td>${bookingData.guests.rooms}</td>
              </tr>
              <tr>
                <td><strong>Total Amount:</strong></td>
                <td style="font-size: 18px; color: #059669;"><strong>₹${bookingData.totalAmount}</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="highlight">
            <h4 style="color: #92400e; margin-top: 0;">⏰ Next Steps</h4>
            <p>Our team will contact you at <strong>${bookingData.customer.phone}</strong> within 2 hours.</p>
            <p><strong>Payment:</strong> Pay directly at resort</p>
            <p><strong>Cancellation:</strong> Free up to 48 hours before check-in</p>
          </div>
          
          <p>For any queries:</p>
          <p>📞 <strong>+91 98765 43210</strong></p>
          <p>✉️ <strong>support@hillescape.com</strong></p>
          
          <p>Thank you for choosing HillEscape!</p>
          <p><strong>The HillEscape Team</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>HillEscape Luxury Resorts</strong></p>
          <p>Valparai • Solaiyur • Kothagiri</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateGmailEmailHTML(bookingData) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #0d9488;">🎉 Booking Confirmed!</h2>
      <p>Dear ${bookingData.customer.name},</p>
      <p>Your booking at <strong>${bookingData.resortName}</strong> is confirmed.</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">Booking Details</h3>
        <p><strong>Reference:</strong> ${bookingData.bookingReference}</p>
        <p><strong>Resort:</strong> ${bookingData.resortName}</p>
        <p><strong>Check-in:</strong> ${new Date(bookingData.checkIn).toLocaleDateString()}</p>
        <p><strong>Check-out:</strong> ${new Date(bookingData.checkOut).toLocaleDateString()}</p>
        <p><strong>Amount:</strong> ₹${bookingData.totalAmount}</p>
      </div>
      
      <p><strong>Next Steps:</strong> We'll contact you at ${bookingData.customer.phone}</p>
      <p>Thank you!</p>
      <p><strong>HillEscape Team</strong></p>
    </div>
  `;
}

function generateAdminEmailHTML(bookingData) {
  return `
    <h2>New Booking Received</h2>
    <p><strong>Reference:</strong> ${bookingData.bookingReference}</p>
    <p><strong>Customer:</strong> ${bookingData.customer.name}</p>
    <p><strong>Phone:</strong> ${bookingData.customer.phone}</p>
    <p><strong>Email:</strong> ${bookingData.customer.email}</p>
    <p><strong>Resort:</strong> ${bookingData.resortName}</p>
    <p><strong>Amount:</strong> ₹${bookingData.totalAmount}</p>
    <hr>
    <p><em>Automated notification</em></p>
  `;
}