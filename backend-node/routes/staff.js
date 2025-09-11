const express = require('express');
const { Pool } = require('pg');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateStaff } = require('../middleware/validation');
require('dotenv').config();
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

// Create staff (only owners and managers)
router.post('/', authenticateToken, requireRole(['owner', 'manager']), validateStaff, async (req, res) => {
  try {
    const { username, email, first_name, last_name, role, phone_number } = req.body;
    
    // Create staff member
    const staffResult = await pool.query(
      `INSERT INTO accounts_user (username, email, first_name, last_name, role, phone_number, business_id, is_active_staff)
       VALUES ($1, $2, $3, $4, $5, $6, $7::bigint, true)
       RETURNING id, username, first_name, last_name, email, role`,
      [username, email, first_name, last_name, role, phone_number, req.user.business_id]
    );
    
    res.status(201).json({
      message: 'Staff created successfully',
      staff: staffResult.rows[0]
    });
  } catch (error) {
    console.error('Create staff error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create staff' });
    }
  }
});

module.exports = router;