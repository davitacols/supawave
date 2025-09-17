const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Credit dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_credit_customers,
         COALESCE(SUM(current_balance), 0) as total_outstanding,
         COALESCE(AVG(current_balance), 0) as average_balance,
         COALESCE(SUM(current_balance), 0) as overdue_amount
       FROM credit_creditcustomer 
       WHERE business_id = $1::bigint AND current_balance > 0`,
      [req.user.business_id]
    );
    
    res.json({
      total_credit_customers: parseInt(result.rows[0].total_credit_customers) || 0,
      total_outstanding: parseFloat(result.rows[0].total_outstanding) || 0,
      average_balance: parseFloat(result.rows[0].average_balance) || 0,
      overdue_amount: parseFloat(result.rows[0].overdue_amount) || 0,
      weekly_collections: 0, // Would need payment tracking
      monthly_collections: 0, // Would need payment tracking
      collection_rate: 0, // Would need payment tracking
      new_credit_customers: 0 // Would need time-based tracking
    });
  } catch (error) {
    console.error('Credit dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch credit dashboard' });
  }
});

// Get credit customers
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM credit_creditcustomer 
       WHERE business_id = $1::bigint AND current_balance > 0
       ORDER BY current_balance DESC`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get credit customers error:', error);
    res.status(500).json({ error: 'Failed to fetch credit customers' });
  }
});

// Get credit sales
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, c.name as customer_name
       FROM sales_sale s
       LEFT JOIN credit_creditcustomer c ON s.customer_phone = c.phone
       WHERE s.business_id = $1::bigint
       ORDER BY s.created_at DESC
       LIMIT 50`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get credit sales error:', error);
    res.status(500).json({ error: 'Failed to fetch credit sales' });
  }
});

module.exports = router;