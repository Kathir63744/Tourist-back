const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Initialize Resend with safe handling
let resend;
try {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
    resend = new Resend(process.env.RESEND_API_KEY);
  } else {
    resend = null;
  }
} catch (error) {
  resend = null;
}

// Create Gmail transporter
let gmailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
}

// Main email sending function
exports.sendBookingConfirmation = async (bookingData) => {
  // Try Resend first
  if (resend) {
    const resendResult = await sendViaResend(bookingData);
    if (resendResult.success) return resendResult;
  }
  
  // Try Gmail second
  if (gmailTransporter) {
    const gmailResult = await sendViaGmail(bookingData);
    if (gmailResult.success) return gmailResult;
  }
  
  // Fallback to console
  return sendViaConsole(bookingData);
};

// Send via Resend
async function sendViaResend(bookingData) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HillEscape <booking@hillescape.com>',
      to: bookingData.customer.email,
      subject: `Booking Confirmation #${bookingData.bookingReference} - HillEscape Resorts`,
      html: generateEmailHTML(bookingData),
    });

    if (error) throw error;

    return { success: true, service: 'resend', messageId: data.id };
  } catch (error) {
    return { success: false, service: 'resend', error: error.message };
  }
}

// Send via Gmail
async function sendViaGmail(bookingData) {
  try {
    const info = await gmailTransporter.sendMail({
      from: `"HillEscape Resorts" <${process.env.EMAIL_USER}>`,
      to: bookingData.customer.email,
      subject: `Booking Confirmation #${bookingData.bookingReference} - HillEscape Resorts`,
      html: generateEmailHTML(bookingData),
    });

    return { success: true, service: 'gmail', messageId: info.messageId };
  } catch (error) {
    return { success: false, service: 'gmail', error: error.message };
  }
}

// Fallback to console
function sendViaConsole(bookingData) {
  console.log('📧 Email would be sent to:', bookingData.customer.email);
  return { success: true, service: 'console', testMode: true };
}

// Admin notification
exports.sendAdminNotification = async (bookingData) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) return { success: false, message: 'No admin email configured' };

  // Try Resend
  if (resend) {
    try {
      await resend.emails.send({
        from: 'HillEscape Bookings <booking@hillescape.com>',
        to: adminEmail,
        subject: `New Booking: ${bookingData.bookingReference}`,
        html: generateAdminEmailHTML(bookingData),
      });
      return { success: true, service: 'resend' };
    } catch (error) {
      console.log('Resend admin failed:', error.message);
    }
  }

  // Try Gmail
  if (gmailTransporter) {
    try {
      await gmailTransporter.sendMail({
        from: `"HillEscape Bookings" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `New Booking: ${bookingData.bookingReference}`,
        html: generateAdminEmailHTML(bookingData),
      });
      return { success: true, service: 'gmail' };
    } catch (error) {
      console.log('Gmail admin failed:', error.message);
    }
  }

  return { success: true, service: 'console', testMode: true };
};

// Main email template with beautiful design
function generateEmailHTML(bookingData) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - HillEscape Resorts</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        
        .logo-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .confirmation-badge {
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 15px;
            font-weight: 600;
            font-size: 14px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 25px;
        }
        
        .highlight {
            color: #059669;
            font-weight: 600;
        }
        
        .booking-card {
            background: #f9fafb;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #059669;
        }
        
        .booking-title {
            color: #059669;
            font-size: 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .info-item {
            margin-bottom: 12px;
        }
        
        .info-label {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .info-value {
            color: #111827;
            font-weight: 500;
            font-size: 15px;
        }
        
        .amount-box {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
            border: 2px solid #10b981;
        }
        
        .amount-label {
            color: #065f46;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .amount-value {
            color: #065f46;
            font-size: 32px;
            font-weight: bold;
        }
        
        .section {
            margin: 30px 0;
        }
        
        .section-title {
            color: #374151;
            font-size: 18px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .next-steps {
            background: #fff7ed;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #f59e0b;
        }
        
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .step-number {
            background: #f59e0b;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            margin-right: 12px;
            flex-shrink: 0;
        }
        
        .contact-info {
            background: #eff6ff;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .contact-icon {
            width: 20px;
            margin-right: 10px;
            color: #3b82f6;
        }
        
        .footer {
            background: #1f2937;
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 20px 0;
        }
        
        .footer-link {
            color: #d1d5db;
            text-decoration: none;
            font-size: 14px;
        }
        
        .copyright {
            color: #9ca3af;
            font-size: 12px;
            margin-top: 20px;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            background: #10b981;
            color: white;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 25px 0;
        }
        
        @media (max-width: 600px) {
            .content, .header {
                padding: 25px 20px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .footer-links {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">🏔️ HillEscape</div>
            <div class="logo-subtitle">Luxury Mountain Resorts</div>
            <div class="confirmation-badge">✅ BOOKING CONFIRMED</div>
        </div>

        <!-- Main Content -->
        <div class="content">
            <!-- Greeting -->
            <div class="greeting">
                Dear <span class="highlight">${bookingData.customer.name}</span>,<br>
                Thank you for choosing HillEscape! Your mountain getaway is confirmed.
            </div>

            <!-- Booking Reference -->
            <div style="text-align: center; margin: 20px 0;">
                <div class="info-label">BOOKING REFERENCE</div>
                <div style="font-size: 24px; font-weight: bold; color: #059669; letter-spacing: 2px;">
                    ${bookingData.bookingReference}
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                    Please quote this reference at check-in
                </div>
            </div>

            <!-- Booking Details Card -->
            <div class="booking-card">
                <div class="booking-title">
                    📋 Booking Summary
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Resort</div>
                        <div class="info-value">${bookingData.resortName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Room Type</div>
                        <div class="info-value">${bookingData.roomType}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Check-in</div>
                        <div class="info-value">
                            ${new Date(bookingData.checkIn).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}<br>
                            <small style="color: #6b7280;">2:00 PM onwards</small>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Check-out</div>
                        <div class="info-value">
                            ${new Date(bookingData.checkOut).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}<br>
                            <small style="color: #6b7280;">By 11:00 AM</small>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Duration</div>
                        <div class="info-value">
                            ${Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))} Nights
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Guests</div>
                        <div class="info-value">
                            ${bookingData.guests.adults} Adults, ${bookingData.guests.children} Children<br>
                            <small style="color: #6b7280;">${bookingData.guests.rooms} Room(s)</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Total Amount -->
            <div class="amount-box">
                <div class="amount-label">TOTAL AMOUNT</div>
                <div class="amount-value">₹${bookingData.totalAmount.toLocaleString('en-IN')}</div>
                <div style="color: #065f46; font-size: 14px; margin-top: 10px;">
                    💰 Pay directly at resort
                </div>
            </div>

            <!-- Next Steps -->
            <div class="section">
                <div class="section-title">⏰ Next Steps</div>
                <div class="next-steps">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div>
                            <strong>Confirmation Call</strong><br>
                            Our team will contact you at <strong>${bookingData.customer.phone}</strong> within 2 hours
                        </div>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <div>
                            <strong>Payment</strong><br>
                            Pay the amount at the resort during check-in
                        </div>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <div>
                            <strong>Check-in</strong><br>
                            Arrive at the resort with this confirmation and ID proof
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contact Information -->
            <div class="section">
                <div class="section-title">📞 Contact Information</div>
                <div class="contact-info">
                    <div class="contact-item">
                        <div style="width: 20px; margin-right: 10px;">📱</div>
                        <div>
                            <strong>Customer Details</strong><br>
                            ${bookingData.customer.name}<br>
                            ${bookingData.customer.phone}<br>
                            ${bookingData.customer.email}
                        </div>
                    </div>
                    <div class="divider"></div>
                    <div class="contact-item">
                        <div style="width: 20px; margin-right: 10px;">🏔️</div>
                        <div>
                            <strong>HillEscape Support</strong><br>
                            Phone: +91 98765 43210<br>
                            Email: support@hillescape.com<br>
                            Hours: 8 AM - 10 PM Daily
                        </div>
                    </div>
                </div>
            </div>

            <!-- Important Notes -->
            <div class="section">
                <div class="section-title">📌 Important Information</div>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 14px;">
                    <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                        <div style="margin-right: 10px;">✅</div>
                        <div>Free cancellation up to 48 hours before check-in</div>
                    </div>
                    <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                        <div style="margin-right: 10px;">✅</div>
                        <div>Early check-in/late check-out subject to availability</div>
                    </div>
                    <div style="display: flex; align-items: flex-start;">
                        <div style="margin-right: 10px;">✅</div>
                        <div>Valid government ID proof required at check-in</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">HillEscape Resorts</div>
            <div style="color: #d1d5db; margin-bottom: 20px;">
                Experience luxury amidst nature's splendor
            </div>
            
            <div class="footer-links">
                <a href="#" class="footer-link">Our Resorts</a>
                <a href="#" class="footer-link">Contact Us</a>
                <a href="#" class="footer-link">FAQs</a>
                <a href="#" class="footer-link">Cancellation Policy</a>
            </div>
            
            <div style="margin: 20px 0;">
                <div style="display: inline-block; padding: 8px 16px; background: #374151; border-radius: 6px; margin: 0 5px;">
                    Valparai
                </div>
                <div style="display: inline-block; padding: 8px 16px; background: #374151; border-radius: 6px; margin: 0 5px;">
                    Solaiyur
                </div>
                <div style="display: inline-block; padding: 8px 16px; background: #374151; border-radius: 6px; margin: 0 5px;">
                    Kothagiri
                </div>
            </div>
            
            <div class="copyright">
                © ${new Date().getFullYear()} HillEscape Luxury Resorts. All rights reserved.<br>
                This is an automated email. Please do not reply directly.
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Admin email template
function generateAdminEmailHTML(bookingData) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking - HillEscape</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; }
        .alert-icon { font-size: 40px; margin-bottom: 15px; }
        .content { padding: 30px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .info-card { background: #fef2f2; border-radius: 8px; padding: 15px; border-left: 4px solid #dc2626; }
        .info-label { color: #991b1b; font-size: 12px; font-weight: 600; margin-bottom: 5px; }
        .info-value { color: #111827; font-weight: 500; }
        .amount { font-size: 28px; color: #065f46; font-weight: bold; text-align: center; margin: 20px 0; }
        .action-box { background: #fff7ed; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b; }
        .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">🔔</div>
            <h1 style="margin: 0;">NEW BOOKING RECEIVED</h1>
            <p style="opacity: 0.9; margin: 10px 0 0 0;">Requires immediate attention</p>
        </div>
        
        <div class="content">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 14px; color: #6b7280;">Booking Reference</div>
                <div style="font-size: 24px; font-weight: bold; color: #dc2626; letter-spacing: 2px;">
                    ${bookingData.bookingReference}
                </div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">
                    ${new Date().toLocaleString('en-IN')}
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-label">CUSTOMER NAME</div>
                    <div class="info-value">${bookingData.customer.name}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">PHONE NUMBER</div>
                    <div class="info-value">
                        <a href="tel:${bookingData.customer.phone}" style="color: #111827; text-decoration: none;">
                            📞 ${bookingData.customer.phone}
                        </a>
                    </div>
                </div>
                <div class="info-card">
                    <div class="info-label">EMAIL</div>
                    <div class="info-value">
                        <a href="mailto:${bookingData.customer.email}" style="color: #111827; text-decoration: none;">
                            ✉️ ${bookingData.customer.email}
                        </a>
                    </div>
                </div>
                <div class="info-card">
                    <div class="info-label">RESORT</div>
                    <div class="info-value">${bookingData.resortName}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">ROOM TYPE</div>
                    <div class="info-value">${bookingData.roomType}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">DATES</div>
                    <div class="info-value">
                        ${new Date(bookingData.checkIn).toLocaleDateString('en-IN')} to<br>
                        ${new Date(bookingData.checkOut).toLocaleDateString('en-IN')}
                    </div>
                </div>
            </div>
            
            <div class="amount">
                ₹${bookingData.totalAmount.toLocaleString('en-IN')}
            </div>
            
            <div class="action-box">
                <h3 style="color: #92400e; margin-top: 0;">⏰ REQUIRED ACTION</h3>
                <p><strong>Contact customer within 2 hours</strong></p>
                <p>Call or WhatsApp: <strong>${bookingData.customer.phone}</strong></p>
                <p>Verify booking details and confirm availability.</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 14px;">
                <strong>Booking Details:</strong><br>
                • ${bookingData.guests.adults} Adults, ${bookingData.guests.children} Children<br>
                • ${bookingData.guests.rooms} Room(s)<br>
                • ${Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))} Nights
            </div>
        </div>
        
        <div class="footer">
            Automated Notification | HillEscape Booking System
        </div>
    </div>
</body>
</html>
  `;
}

// Test function
exports.testEmailConnections = async () => {
  const results = {};
  
  // Test Resend
  if (resend) {
    results.resend = { success: true, message: 'Resend configured' };
  } else {
    results.resend = { success: false, message: 'Resend not configured' };
  }
  
  // Test Gmail
  if (gmailTransporter) {
    try {
      await gmailTransporter.verify();
      results.gmail = { success: true, message: 'Gmail configured' };
    } catch (error) {
      results.gmail = { success: false, message: error.message };
    }
  } else {
    results.gmail = { success: false, message: 'Gmail not configured' };
  }
  
  results.console = { success: true, message: 'Console fallback available' };
  
  return results;
};