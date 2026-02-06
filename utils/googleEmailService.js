const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const OAuth2 = google.auth.OAuth2;

// Store user tokens (in production, use a database)
const userTokens = new Map();

// Store an email for development testing
const storeUserEmail = (userId, email, tokens) => {
  userTokens.set(userId, { email, tokens });
  console.log(`📧 Stored email for user ${userId}: ${email}`);
};

// Get user email by userId
const getUserEmail = (userId) => {
  return userTokens.get(userId)?.email;
};

// Create OAuth2 client
const createOAuth2Client = () => {
  return new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/callback'
  );
};

// Send email using user's Gmail account
exports.sendEmailUsingUserGmail = async (userId, emailData) => {
  try {
    const userData = userTokens.get(userId);
    
    if (!userData || !userData.tokens) {
      console.error('❌ No OAuth tokens found for user:', userId);
      return { 
        success: false, 
        error: 'User not authenticated with Gmail',
        fallback: true 
      };
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(userData.tokens);

    // Create transporter with OAuth2
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: userData.email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: userData.tokens.refresh_token,
        accessToken: userData.tokens.access_token,
      },
    });

    // Send email
    const result = await transporter.sendMail(emailData);
    console.log(`✅ Email sent using ${userData.email}'s Gmail account`);
    
    return { 
      success: true, 
      messageId: result.messageId,
      from: userData.email
    };

  } catch (error) {
    console.error('❌ Error sending email with user Gmail:', error);
    
    // Fallback to admin email or test mode
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
};

// Fallback: Send email using admin Gmail account
exports.sendEmailUsingAdminGmail = async (emailData) => {
  try {
    if (!process.env.ADMIN_GMAIL_USER || !process.env.ADMIN_GMAIL_PASS) {
      throw new Error('Admin Gmail credentials not configured');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_GMAIL_USER,
        pass: process.env.ADMIN_GMAIL_PASS, // Use app password, not regular password
      },
    });

    const result = await transporter.sendMail(emailData);
    console.log(`✅ Email sent using admin Gmail`);
    
    return { 
      success: true, 
      messageId: result.messageId,
      from: process.env.ADMIN_GMAIL_USER
    };

  } catch (error) {
    console.error('❌ Error sending email with admin Gmail:', error);
    
    // Ultimate fallback: log to console
    console.log('📧 EMAIL WOULD BE SENT:');
    console.log('   To:', emailData.to);
    console.log('   Subject:', emailData.subject);
    console.log('   Body length:', emailData.html?.length || emailData.text?.length || 0);
    
    return {
      success: true,
      message: 'Email logged (development mode)',
      testMode: true
    };
  }
};

// Test mode: Just log email
exports.sendEmailTestMode = async (emailData) => {
  console.log('📧 TEST MODE - Email details:');
  console.log('   To:', emailData.to);
  console.log('   Subject:', emailData.subject);
  console.log('   From:', emailData.from);
  console.log('   Booking details logged to console');
  
  return {
    success: true,
    message: 'Email logged (test mode)',
    testMode: true
  };
};

module.exports = {
  sendEmailUsingUserGmail,
  sendEmailUsingAdminGmail,
  sendEmailTestMode,
  storeUserEmail,
  getUserEmail
};