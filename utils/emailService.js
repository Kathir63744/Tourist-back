const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // tourfinder997@gmail.com
    pass: process.env.EMAIL_PASS  // rewd degc wdds xqbj
  }
});

// In sendEmail function:
const info = await transporter.sendMail({
  from: `"HillEscape Resorts" <${process.env.EMAIL_USER}>`, // tourfinder997@gmail.com
  to: to,
  subject: subject,
  html: generateEmailHTML(bookingData),
  replyTo: process.env.EMAIL_USER
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Gmail SMTP Error:', error.message);
  } else {
    console.log('✅ Gmail SMTP Ready to send emails');
  }
});

exports.sendEmail = async ({ to, subject, bookingData }) => {
  console.log('\n📧 ====== SENDING EMAIL ======');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Reference: ${bookingData.bookingReference}`);
  
  try {
    // Send email via Gmail SMTP
    const info = await transporter.sendMail({
      from: `"HillEscape Resorts" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: generateEmailHTML(bookingData),
      replyTo: process.env.EMAIL_USER
    });

    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('==============================\n');
    
    return { 
      success: true, 
      service: 'gmail',
      messageId: info.messageId 
    };
    
  } catch (error) {
    console.error('❌ Gmail SMTP Error:', error.message);
    
    // Fallback: Log to console
    console.log('\n📧 EMAIL CONTENT (Logged):');
    console.log('='.repeat(50));
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('-'.repeat(50));
    console.log(generateEmailHTML(bookingData).replace(/<[^>]*>/g, '\n'));
    console.log('='.repeat(50));
    
    return { 
      success: true, 
      service: 'console',
      message: 'Email logged to console'
    };
  }
};

function generateEmailHTML(bookingData) {
  const ref = bookingData.bookingReference;
  const name = bookingData.customer?.name || 'Guest';
  const email = bookingData.customer?.email || '';
  const phone = bookingData.customer?.phone || 'Not provided';
  const resort = bookingData.resortDetails?.name || bookingData.resortName || 'HillEscape Resort';
  const roomType = bookingData.resortDetails?.roomType || bookingData.roomType || 'Deluxe Room';
  const checkIn = bookingData.stayDetails?.checkIn || bookingData.checkIn || new Date().toISOString().split('T')[0];
  const checkOut = bookingData.stayDetails?.checkOut || bookingData.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const total = bookingData.paymentDetails?.totalAmount || bookingData.totalAmount || 2603;
  
  const checkInDate = new Date(checkIn).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const checkOutDate = new Date(checkOut).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background: #f3f4f6; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0d9488, #059669); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 12px; font-size: 14px; }
    .content { padding: 32px; }
    .ref-box { background: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .ref-title { font-size: 12px; color: #059669; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .ref-number { font-size: 32px; font-weight: bold; color: #059669; font-family: monospace; letter-spacing: 4px; }
    .card { background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb; }
    .row { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .label { color: #6b7280; font-size: 14px; }
    .value { font-weight: 600; color: #1f2937; }
    .total { background: #ecfdf5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .total-label { color: #059669; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; }
    .total-amount { font-size: 36px; font-weight: bold; color: #059669; margin: 8px 0; }
    .next-steps { background: #fffbeb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .next-steps h3 { color: #b45309; margin-bottom: 16px; }
    .step { display: flex; align-items: center; margin-bottom: 12px; }
    .step-number { width: 24px; height: 24px; background: #f59e0b; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; }
    .contact { background: #eff6ff; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .footer { background: #1f2937; color: white; padding: 32px; text-align: center; }
    .footer p { color: #d1d5db; margin: 8px 0; font-size: 14px; }
    @media (max-width: 600px) { .container { margin: 10px; } .content { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🏔️ HillEscape</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">Luxury Mountain Resorts</p>
      <div class="badge">✓ BOOKING CONFIRMED</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <p style="font-size: 18px; margin-bottom: 8px;">Dear <strong>${name}</strong>,</p>
      <p style="color: #4b5563; margin-bottom: 24px;">Thank you for choosing HillEscape. Your mountain getaway is confirmed!</p>
      
      <!-- Booking Reference -->
      <div class="ref-box">
        <div class="ref-title">Booking Reference</div>
        <div class="ref-number">${ref}</div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 12px;">Please quote this reference at check-in</p>
      </div>
      
      <!-- Resort Details -->
      <div class="card">
        <h3 style="color: #059669; margin-bottom: 20px;">🏨 Resort Details</h3>
        <div class="row">
          <span class="label">Resort</span>
          <span class="value">${resort}</span>
        </div>
        <div class="row">
          <span class="label">Room Type</span>
          <span class="value">${roomType}</span>
        </div>
        <div class="row">
          <span class="label">Check-in</span>
          <span class="value">${checkInDate} (2:00 PM)</span>
        </div>
        <div class="row">
          <span class="label">Check-out</span>
          <span class="value">${checkOutDate} (11:00 AM)</span>
        </div>
        <div class="row" style="margin-bottom: 0;">
          <span class="label">Guests</span>
          <span class="value">${bookingData.guests?.adults || 2} Adults, ${bookingData.guests?.children || 0} Children</span>
        </div>
      </div>
      
      <!-- Total Amount -->
      <div class="total">
        <div class="total-label">Total Amount</div>
        <div class="total-amount">₹${total.toLocaleString('en-IN')}</div>
        <p style="color: #6b7280; font-size: 14px;">Pay directly at resort during check-in</p>
      </div>
      
      <!-- Next Steps -->
      <div class="next-steps">
        <h3 style="margin-top: 0;">📋 Next Steps</h3>
        <div class="step">
          <div class="step-number">1</div>
          <span>Our team will call you at <strong>${phone}</strong> within 2 hours</span>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <span>Pay the amount at the resort during check-in</span>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <span>Bring this confirmation and valid ID proof</span>
        </div>
      </div>
      
      <!-- Customer Support -->
      <div class="contact">
        <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 16px;">📞 Need Help?</h3>
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 20px; margin-right: 12px;">📱</span>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Call us anytime</div>
            <div style="font-weight: 600;">+91 98765 43210</div>
          </div>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="font-size: 20px; margin-right: 12px;">✉️</span>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Email us</div>
            <div style="font-weight: 600;">support@hillescape.com</div>
          </div>
        </div>
      </div>
      
      <!-- Customer Information -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Booking made for:</p>
        <p style="font-weight: 600; margin-bottom: 4px;">${name}</p>
        <p style="color: #4b5563; font-size: 14px;">${email}</p>
        <p style="color: #4b5563; font-size: 14px;">${phone}</p>
      </div>
      
      <!-- Thank You -->
      <div style="text-align: center; margin-top: 32px;">
        <p style="font-size: 18px; margin-bottom: 8px;">We look forward to welcoming you! 🎉</p>
        <p style="color: #059669; font-weight: 600;">The HillEscape Team</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">HillEscape Resorts</p>
      <p>Valparai • Solaiyur • Kothagiri</p>
      <p style="margin-top: 24px; font-size: 12px; opacity: 0.8;">
        © ${new Date().getFullYear()} HillEscape Luxury Resorts. All rights reserved.
      </p>
      <p style="font-size: 11px; opacity: 0.6; margin-top: 16px;">
        This is an automated email. Please do not reply directly.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}