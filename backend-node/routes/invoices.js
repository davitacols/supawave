const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, c.name as customer_name, c.email as customer_email
       FROM invoices_invoice i
       LEFT JOIN invoices_customer c ON i.customer_id = c.id
       WHERE i.business_id = $1::bigint
       ORDER BY i.created_at DESC`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get all customers (must come before /:id route)
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching customers for business:', req.user.business_id);
    
    // Try invoices_customer table first
    const result = await pool.query(
      `SELECT * FROM invoices_customer 
       WHERE business_id = $1::bigint 
       ORDER BY name`,
      [req.user.business_id]
    );
    
    console.log('✅ Found', result.rows.length, 'customers');
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    
    // If invoices_customer fails, try customers table
    try {
      console.log('🔄 Trying customers table fallback...');
      const fallbackResult = await pool.query(
        `SELECT id, name, phone, address, created_at 
         FROM customers 
         WHERE business_id = $1::bigint 
         ORDER BY name`,
        [req.user.business_id]
      );
      
      console.log('✅ Fallback found', fallbackResult.rows.length, 'customers');
      res.json(fallbackResult.rows);
    } catch (fallbackError) {
      console.error('Fallback customers error:', fallbackError);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }
});

// Create customer
router.post('/customers', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    const result = await pool.query(
      `INSERT INTO invoices_customer (business_id, name, email, phone, address, created_at)
       VALUES ($1::bigint, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [req.user.business_id, name, email, phone, address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    
    const result = await pool.query(
      `UPDATE invoices_customer 
       SET name = $1, email = $2, phone = $3, address = $4
       WHERE id = $5::bigint AND business_id = $6::bigint
       RETURNING *`,
      [name, email, phone, address, id, req.user.business_id]
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
router.delete('/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM invoices_customer WHERE id = $1::bigint AND business_id = $2::bigint RETURNING id',
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

// Create invoice
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer_id, items, notes, due_date } = req.body;
    
    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }
    
    const tax = subtotal * 0.075; // 7.5% VAT
    const total = subtotal + tax;
    
    const result = await pool.query(
      `INSERT INTO invoices_invoice (business_id, customer_id, subtotal, tax, total, notes, due_date, status, created_at)
       VALUES ($1::bigint, $2::bigint, $3, $4, $5, $6, $7, 'pending', NOW())
       RETURNING *`,
      [req.user.business_id, customer_id, subtotal, tax, total, notes, due_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Get invoice by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone, c.address
       FROM invoices_invoice i
       LEFT JOIN invoices_customer c ON i.customer_id = c.id
       WHERE i.id = $1::bigint AND i.business_id = $2::bigint`,
      [id, req.user.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Update invoice
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE invoices_invoice 
       SET status = $1, notes = $2, updated_at = NOW()
       WHERE id = $3::bigint AND business_id = $4::bigint
       RETURNING *`,
      [status, notes, id, req.user.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});



module.exports = router;