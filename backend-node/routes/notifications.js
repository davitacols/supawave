const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Return empty array for now - can be implemented later
    res.json([]);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;