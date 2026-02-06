const { Resend } = require('resend');

// Initialize with your API key
const resend = new Resend('re_YOUR_API_KEY_HERE');

// Send booking confirmation
exports.sendBookingConfirmation = async (bookingData) => {
  try {
    console.log('📧 Sending email via Resend to:', bookingData.customer.email);
    
    const { data, error } = await resend.emails.send({
      from: 'HillEscape <booking@hillescape.com>',
      to: bookingData.customer.email,
      subject: `Booking Confirmed #${bookingData.bookingReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
            <p>HillEscape Luxury Resorts</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Dear <strong>${bookingData.customer.name}</strong>,</p>
            <p>Thank you for booking with HillEscape! Your reservation is confirmed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488;">
              <h3 style="color: #0d9488; margin-top: 0;">Booking Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Booking Reference:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #059669;"><strong>${bookingData.bookingReference}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Resort:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${bookingData.resortName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-in:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(bookingData.checkIn).toLocaleDateString('en-IN')} (2:00 PM)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-out:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(bookingData.checkOut).toLocaleDateString('en-IN')} (11:00 AM)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Guests:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${bookingData.guests.adults} Adults, ${bookingData.guests.children} Children</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Total Amount:</strong></td>
                  <td style="padding: 8px; font-size: 18px; color: #059669;"><strong>₹${bookingData.totalAmount}</strong></td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbbf24;">
              <h4 style="color: #92400e; margin-top: 0;">⏰ Next Steps</h4>
              <p>Our team will contact you at <strong>${bookingData.customer.phone}</strong> within 2 hours.</p>
              <p><strong>Payment:</strong> Pay directly at resort (no advance payment)</p>
              <p><strong>Cancellation:</strong> Free up to 48 hours before check-in</p>
            </div>
            
            <p>For any queries, contact us:</p>
            <p>📞 <strong>+91 98765 43210</strong></p>
            <p>✉️ <strong>support@hillescape.com</strong></p>
            
            <p>We look forward to welcoming you!</p>
            <p><strong>The HillEscape Team</strong></p>
          </div>
          
          <div style="background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
            <p><strong>HillEscape Luxury Resorts</strong></p>
            <p>Valparai • Solaiyur • Kothagiri</p>
            <p>📞 +91 98765 43210 | ✉️ support@hillescape.com</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log('✅ Email sent via Resend! ID:', data.id);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    
    // Fallback: Log to console
    console.log('\n📧 FALLBACK - Email details:');
    console.log('   To:', bookingData.customer.email);
    console.log('   Reference:', bookingData.bookingReference);
    console.log('   Amount: ₹' + bookingData.totalAmount);
    
    return { 
      success: true, 
      message: 'Email logged (fallback mode)',
      testMode: true 
    };
  }
};

// Send admin notification
exports.sendAdminNotification = async (bookingData) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HillEscape Booking <booking@hillescape.com>',
      to: 'admin@hillescape.com', // Change to your admin email
      subject: `New Booking: ${bookingData.bookingReference}`,
      html: `
        <h2>New Booking Received</h2>
        <p><strong>Reference:</strong> ${bookingData.bookingReference}</p>
        <p><strong>Customer:</strong> ${bookingData.customer.name}</p>
        <p><strong>Phone:</strong> ${bookingData.customer.phone}</p>
        <p><strong>Email:</strong> ${bookingData.customer.email}</p>
        <p><strong>Resort:</strong> ${bookingData.resortName}</p>
        <p><strong>Amount:</strong> ₹${bookingData.totalAmount}</p>
        <p><strong>Check-in:</strong> ${new Date(bookingData.checkIn).toLocaleDateString()}</p>
        <hr>
        <p><em>This booking has been automatically confirmed.</em></p>
      `,
    });

    if (error) throw error;
    
    console.log('📧 Admin notification sent');
    return { success: true };
    
  } catch (error) {
    console.error('Admin notification error:', error);
    return { success: false };
  }
};