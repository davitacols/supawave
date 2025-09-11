const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const router = express.Router();

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

// Get all sales
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get sales from Django tables
    const result = await pool.query(
      `SELECT s.id, s.total_amount as total, s.created_at, s.customer_phone,
              '[]'::json as items
       FROM sales_sale s
       JOIN accounts_business b ON s.business_id = b.id
       WHERE b.owner_id = $1
       ORDER BY s.created_at DESC
       LIMIT 50`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Create sale
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { items, customer_name, payment_method, discount = 0 } = req.body;
    
    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }
    
    const total = subtotal - discount;
    
    // Create sale
    const saleResult = await client.query(
      `INSERT INTO sales (user_id, customer_name, subtotal, discount, total, payment_method, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [req.user.userId, customer_name, subtotal, discount, total, payment_method]
    );
    
    const sale = saleResult.rows[0];
    
    // Create sale items and update inventory
    for (const item of items) {
      // Add sale item
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, total) 
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.id, item.product_id, item.quantity, item.price, item.price * item.quantity]
      );
      
      // Update product quantity
      await client.query(
        `UPDATE products SET quantity = quantity - $1, updated_at = NOW() 
         WHERE id = $2 AND user_id = $3`,
        [item.quantity, item.product_id, req.user.userId]
      );
    }
    
    await client.query('COMMIT');
    
    // Fetch complete sale with items
    const completeSale = await pool.query(
      `SELECT s.*, 
              json_agg(
                json_build_object(
                  'product_id', si.product_id,
                  'product_name', p.name,
                  'quantity', si.quantity,
                  'price', si.price,
                  'total', si.total
                )
              ) as items
       FROM sales s
       LEFT JOIN sale_items si ON s.id = si.sale_id
       LEFT JOIN products p ON si.product_id = p.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [sale.id]
    );
    
    res.status(201).json(completeSale.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  } finally {
    client.release();
  }
});

// Get sales analytics - matching Django implementation
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // Get user's business ID
    const businessResult = await pool.query(
      'SELECT id FROM accounts_business WHERE owner_id = $1::bigint',
      [req.user.userId]
    );
    
    if (businessResult.rows.length === 0) {
      return res.json({
        daily_revenue: [],
        top_products: [],
        monthly_revenue: 0,
        monthly_sales_count: 0
      });
    }
    
    const businessId = businessResult.rows[0].id;
    const now = new Date();
    
    // Daily revenue (last 7 days) - matching Django
    const dailyRevenue = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const result = await pool.query(
        'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_sale WHERE business_id = $1::bigint AND DATE(created_at) = $2',
        [businessId, dateStr]
      );
      
      dailyRevenue.push({
        date: dateStr,
        revenue: parseFloat(result.rows[0].total)
      });
    }
    
    // Monthly stats - matching Django
    const monthlyRevenueResult = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_sale WHERE business_id = $1::bigint AND EXTRACT(MONTH FROM created_at) = $2 AND EXTRACT(YEAR FROM created_at) = $3',
      [businessId, now.getMonth() + 1, now.getFullYear()]
    );
    
    const monthlySalesResult = await pool.query(
      'SELECT COUNT(*) as count FROM sales_sale WHERE business_id = $1::bigint AND EXTRACT(MONTH FROM created_at) = $2 AND EXTRACT(YEAR FROM created_at) = $3',
      [businessId, now.getMonth() + 1, now.getFullYear()]
    );
    
    res.json({
      daily_revenue: dailyRevenue,
      top_products: [], // Will implement later
      monthly_revenue: parseFloat(monthlyRevenueResult.rows[0].total),
      monthly_sales_count: parseInt(monthlySalesResult.rows[0].count)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;