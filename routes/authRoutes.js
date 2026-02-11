const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { storeUserEmail } = require('../utils/googleEmailService');

const OAuth2 = google.auth.OAuth2;

// Initialize OAuth2 client
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/callback'
);

// Generate auth URL
const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Redirect to Google OAuth
router.get('/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force to get refresh token
  });
  
  res.redirect(authUrl);
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('No authorization code provided');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    // Store tokens with user ID
    const userId = userInfo.data.id;
    const userEmail = userInfo.data.email;
    const { OAuth2Client } = require('google-auth-library');
    
    storeUserEmail(userId, userEmail, tokens);
    
    // Return success page
    res.send(`
      <html>
        <head>
          <title>Gmail Authentication Successful</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #0d9488, #059669);
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 10px; 
              text-align: center; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 { color: #059669; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Gmail Connected Successfully!</h1>
            <p>Your email <strong>${userEmail}</strong> is now connected.</p>
            <p>Booking confirmations will be sent from your Gmail account.</p>
            <p>You can close this window and continue booking.</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Check if user has Gmail connected
router.get('/status/:userId', (req, res) => {
  const { userId } = req.params;
  const userData = require('../utils/googleEmailService').getUserEmail(userId);
  
  res.json({
    connected: !!userData,
    email: userData || null
  });
});

router.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Same as frontend
    });
    
    const payload = ticket.getPayload();
    
    // Create user session
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
    
    // Create JWT for your app
    const appToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token: appToken,
      user
    });
    
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

module.exports = router;