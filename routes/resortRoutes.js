const express = require('express');
const router = express.Router();
const resortController = require('../controllers/resortController');

// Get all resorts with optional filters
router.get('/', resortController.getAllResorts);

// Get single resort
router.get('/:id', resortController.getResortById);

// Create resort (admin)
router.post('/', resortController.createResort);

module.exports = router;