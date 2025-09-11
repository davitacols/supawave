const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware to verify JWT
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

// Get all products
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.sku, p.barcode, p.cost_price, p.selling_price as price, 
              p.stock_quantity as quantity, p.low_stock_threshold, p.is_active, 
              p.created_at, p.updated_at, c.name as category 
       FROM inventory_product p 
       LEFT JOIN inventory_category c ON p.category_id = c.id 
       WHERE p.business_id IN (SELECT id FROM accounts_business WHERE owner_id = $1) 
       ORDER BY p.created_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
router.post('/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, cost_price, quantity, sku, category, low_stock_threshold } = req.body;
    
    // Get user's business
    const businessResult = await pool.query(
      'SELECT id FROM accounts_business WHERE owner_id = $1 LIMIT 1',
      [req.user.userId]
    );
    
    if (businessResult.rows.length === 0) {
      return res.status(400).json({ error: 'No business found for user' });
    }
    
    const businessId = businessResult.rows[0].id;
    
    const result = await pool.query(
      `INSERT INTO inventory_product (name, description, price, cost_price, quantity, sku, 
                                    low_stock_threshold, business_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
       RETURNING *`,
      [name, description, price, cost_price, quantity, sku, low_stock_threshold, businessId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, cost_price, quantity, sku, category, low_stock_threshold } = req.body;
    
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, cost_price = $4, quantity = $5, 
           sku = $6, category = $7, low_stock_threshold = $8, updated_at = NOW()
       WHERE id = $9 AND user_id = $10 
       RETURNING *`,
      [name, description, price, cost_price, quantity, sku, category, low_stock_threshold, id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get low stock products
router.get('/products/low-stock', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.sku, p.stock_quantity as quantity, p.low_stock_threshold 
       FROM inventory_product p
       JOIN accounts_business b ON p.business_id = b.id
       WHERE b.owner_id = $1 AND p.stock_quantity <= p.low_stock_threshold 
       ORDER BY p.stock_quantity ASC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Get categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.created_at 
       FROM inventory_category c
       JOIN accounts_business b ON c.business_id = b.id
       WHERE b.owner_id = $1
       ORDER BY c.name`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;