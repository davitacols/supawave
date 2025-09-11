const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all staff
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('👥 /api/staff/ called for user:', req.user.userId);
    
    // Get user's business ID
    const businessResult = await pool.query(
      'SELECT id FROM accounts_business WHERE owner_id = $1::bigint',
      [req.user.userId]
    );
    
    if (businessResult.rows.length === 0) {
      return res.json([]);
    }
    
    const businessId = businessResult.rows[0].id;
    
    // Get staff (managers and cashiers)
    const staffResult = await pool.query(
      `SELECT id, username, first_name, last_name, email, phone_number, role, is_active_staff
       FROM accounts_user 
       WHERE business_id = $1::bigint AND role IN ('manager', 'cashier')
       ORDER BY first_name, last_name`,
      [businessId]
    );
    
    console.log('👥 /api/staff/ returning:', staffResult.rows.length, 'staff members');
    res.json(staffResult.rows);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Create staff
router.post('/', authenticateToken, async (req, res) => {
  try {
    res.status(201).json({ message: 'Staff created successfully' });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

module.exports = router;