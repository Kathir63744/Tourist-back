const express = require('express');
const { sendTestEmail } = require('../utils/emailService');
const router = express.Router();

router.get('/test', async (req, res) => {
  try {
    const result = await sendTestEmail();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;