const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
              COUNT(s.id) as total_orders,
              COALESCE(SUM(s.total_amount), 0) as total_spent,
              MAX(s.created_at) as last_order_date
       FROM customers_customer c
       LEFT JOIN sales_sale s ON c.id = s.customer_id
       WHERE c.business_id = $1::bigint
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get credit customers
router.get('/credit', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
              COALESCE(c.credit_balance, 0) as credit_balance
       FROM customers_customer c
       WHERE c.business_id = $1::bigint AND c.credit_balance > 0
       ORDER BY c.credit_balance DESC`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get credit customers error:', error);
    res.status(500).json({ error: 'Failed to fetch credit customers' });
  }
});

// Create customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone_number, address, credit_limit } = req.body;
    
    const result = await pool.query(
      `INSERT INTO customers_customer (name, email, phone_number, address, credit_limit, business_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::bigint, NOW())
       RETURNING *`,
      [name, email, phone_number, address, credit_limit || 0, req.user.business_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone_number, address, credit_limit } = req.body;
    
    const result = await pool.query(
      `UPDATE customers_customer 
       SET name = $1, email = $2, phone_number = $3, address = $4, credit_limit = $5
       WHERE id = $6::bigint AND business_id = $7::bigint
       RETURNING *`,
      [name, email, phone_number, address, credit_limit, id, req.user.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM customers_customer WHERE id = $1::bigint AND business_id = $2::bigint RETURNING id',
      [id, req.user.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;