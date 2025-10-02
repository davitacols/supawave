const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { validateSale } = require('../middleware/validation');
const NotificationService = require('../utils/notificationService');
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
    
    const { 
      items, 
      customer_phone, 
      customer_email, 
      customer_id, 
      total_amount, 
      subtotal, 
      tax_amount = 0, 
      discount = 0, 
      payment_method = 'cash', 
      payment_reference, 
      notes 
    } = req.body;
    
    // Create sale
    const saleResult = await client.query(
      `INSERT INTO sales_sale (business_id, customer_phone, customer_email, customer_id, 
                               total_amount, subtotal, tax_amount, discount, payment_method, 
                               payment_reference, notes, created_at)
       VALUES ($1::bigint, $2, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING *`,
      [req.user.business_id, customer_phone || null, customer_email || null, customer_id || null,
       parseFloat(total_amount), parseFloat(subtotal || total_amount), parseFloat(tax_amount), 
       parseFloat(discount), payment_method, payment_reference || null, notes || null]
    );
    
    const sale = saleResult.rows[0];
    
    // Create sale items and update inventory
    for (const item of items) {
      const productId = item.product_id || item.product;
      
      // Get product details for notifications
      const productResult = await client.query(
        'SELECT name, stock_quantity, low_stock_threshold FROM inventory_product WHERE id = $1::uuid AND business_id = $2::bigint',
        [productId, req.user.business_id]
      );
      
      // Create sale item
      await client.query(
        `INSERT INTO sales_saleitem (sale_id, product_id, quantity, unit_price, total_price)
         VALUES ($1::bigint, $2::uuid, $3, $4, $5)`,
        [sale.id, productId, item.quantity, item.unit_price, parseFloat(item.unit_price) * parseInt(item.quantity)]
      );
      
      // Update product quantity
      await client.query(
        'UPDATE inventory_product SET stock_quantity = stock_quantity - $1 WHERE id = $2::uuid AND business_id = $3::bigint',
        [item.quantity, productId, req.user.business_id]
      );
      
      // Check for low stock after sale
      if (productResult.rows.length > 0) {
        const product = productResult.rows[0];
        const newQuantity = product.stock_quantity - item.quantity;
        
        if (newQuantity <= product.low_stock_threshold) {
          await NotificationService.createLowStockNotification(
            req.user.business_id,
            product.name,
            newQuantity,
            product.low_stock_threshold
          );
        }
      }
    }
    
    // Create sale notification
    await NotificationService.createSaleNotification(
      req.user.business_id,
      parseFloat(total_amount),
      customer_phone
    );
    
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