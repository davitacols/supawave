const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { validateSale } = require('../middleware/validation');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all sales
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, total_amount, customer_phone, created_at
       FROM sales_sale
       WHERE business_id = $1::bigint
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Create sale
router.post('/', authenticateToken, validateSale, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { items, customer_id, customer_name, payment_method, discount = 0 } = req.body;
    
    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price FROM inventory_product WHERE id = $1::bigint AND business_id = $2::bigint',
        [item.product_id, req.user.business_id]
      );
      
      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }
      
      subtotal += productResult.rows[0].price * item.quantity;
    }
    
    const total_amount = subtotal - discount;
    
    // Create sale
    const saleResult = await client.query(
      `INSERT INTO sales_sale (business_id, customer_id, customer_name, subtotal, discount, total_amount, payment_method, created_at)
       VALUES ($1::bigint, $2::bigint, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [req.user.business_id, customer_id, customer_name, subtotal, discount, total_amount, payment_method]
    );
    
    const sale = saleResult.rows[0];
    
    // Create sale items and update inventory
    for (const item of items) {
      // Create sale item
      await client.query(
        `INSERT INTO sales_saleitem (sale_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1::bigint, $2::bigint, $3, $4, $5)`,
        [sale.id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
      
      // Update product quantity
      await client.query(
        'UPDATE inventory_product SET quantity = quantity - $1 WHERE id = $2::bigint AND business_id = $3::bigint',
        [item.quantity, item.product_id, req.user.business_id]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(sale);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  } finally {
    client.release();
  }
});

// Get sales analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's sales
    const todayResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM sales_sale 
       WHERE business_id = $1::bigint AND DATE(created_at) = $2`,
      [req.user.business_id, today]
    );
    
    // This month's sales
    const monthResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM sales_sale 
       WHERE business_id = $1::bigint 
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
      [req.user.business_id]
    );
    
    res.json({
      today: todayResult.rows[0],
      this_month: monthResult.rows[0]
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;