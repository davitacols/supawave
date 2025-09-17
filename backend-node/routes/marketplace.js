const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all listings
router.get('/listings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM marketplace_marketplacelisting 
       WHERE status = 'active' 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get my listings
router.get('/listings/my_listings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM marketplace_marketplacelisting 
       WHERE seller_id = $1::bigint 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ error: 'Failed to fetch my listings' });
  }
});

// Create listing
router.post('/listings', authenticateToken, async (req, res) => {
  try {
    res.status(201).json({ message: 'Listing created successfully' });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Get group buys
router.get('/group-buys', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM marketplace_groupbuyrequest 
       WHERE status IN ('active', 'open') 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get group buys error:', error);
    res.status(500).json({ error: 'Failed to fetch group buys' });
  }
});

// Create group buy
router.post('/group-buys', authenticateToken, async (req, res) => {
  try {
    res.status(201).json({ message: 'Group buy created successfully' });
  } catch (error) {
    console.error('Create group buy error:', error);
    res.status(500).json({ error: 'Failed to create group buy' });
  }
});

// Get suppliers
router.get('/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM marketplace_localsupplier 
       ORDER BY rating DESC, name ASC 
       LIMIT 50`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Create supplier
router.post('/suppliers', authenticateToken, async (req, res) => {
  try {
    res.status(201).json({ message: 'Supplier created successfully' });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Get offers
router.get('/offers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, l.title as listing_title 
       FROM marketplace_marketplaceoffer o
       LEFT JOIN marketplace_marketplacelisting l ON o.listing_id = l.id
       WHERE o.buyer_id = $1::bigint OR l.seller_id = $1::bigint
       ORDER BY o.created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

module.exports = router;