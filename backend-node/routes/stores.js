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

// Get all stores
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🏪 Getting stores for user:', req.user.userId);
    
    // Get user's business ID
    const businessResult = await pool.query(
      'SELECT id FROM accounts_business WHERE owner_id = $1::bigint',
      [req.user.userId]
    );
    
    if (businessResult.rows.length === 0) {
      console.log('❌ No business found');
      return res.json([]);
    }
    
    const businessId = businessResult.rows[0].id;
    console.log('🏢 Business ID:', businessId);
    
    // Get stores for this business
    const storesResult = await pool.query(
      `SELECT id, name, address, phone, manager_name, is_main_store, is_active, created_at
       FROM stores_store 
       WHERE business_id = $1::bigint
       ORDER BY created_at DESC`,
      [businessId]
    );
    
    console.log('🏪 Found stores:', storesResult.rows.length);
    res.json(storesResult.rows);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Create store
router.post('/', authenticateToken, async (req, res) => {
  try {
    res.status(201).json({ message: 'Store created successfully' });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Get managers
router.get('/managers', authenticateToken, async (req, res) => {
  try {
    console.log('👥 Getting managers for user:', req.user.userId);
    
    // Get user's business ID
    const businessResult = await pool.query(
      'SELECT id FROM accounts_business WHERE owner_id = $1::bigint',
      [req.user.userId]
    );
    
    if (businessResult.rows.length === 0) {
      return res.json([]);
    }
    
    const businessId = businessResult.rows[0].id;
    
    // Get managers for this business
    const managersResult = await pool.query(
      `SELECT id, username, first_name, last_name, email, phone_number
       FROM accounts_user 
       WHERE business_id = $1::bigint AND role = 'manager'
       ORDER BY first_name, last_name`,
      [businessId]
    );
    
    console.log('👥 Found managers:', managersResult.rows.length);
    res.json(managersResult.rows);
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

module.exports = router;