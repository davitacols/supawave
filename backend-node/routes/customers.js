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
       FROM customers c
       LEFT JOIN sales_sale s ON c.phone = s.customer_phone
       WHERE c.user_id = $1::uuid
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
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
       FROM credit_creditcustomer c
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
      `INSERT INTO customers (name, email, phone, address, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5::uuid, NOW())
       RETURNING *`,
      [name, email, phone_number, address, req.user.id]
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
      `UPDATE customers 
       SET name = $1, email = $2, phone = $3, address = $4
       WHERE id = $5::uuid AND user_id = $6::uuid
       RETURNING *`,
      [name, email, phone_number, address, id, req.user.id]
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
      'DELETE FROM customers WHERE id = $1::uuid AND user_id = $2::uuid RETURNING id',
      [id, req.user.id]
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