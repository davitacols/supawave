const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all products
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const { search, category, low_stock } = req.query;
    let query = `
      SELECT p.*, c.name as category_name,
             CASE WHEN p.quantity <= p.reorder_level THEN true ELSE false END as is_low_stock
      FROM inventory_product p
      LEFT JOIN inventory_category c ON p.category_id = c.id
      WHERE p.business_id = $1::bigint
    `;
    const params = [req.user.business_id];
    
    if (search) {
      query += ` AND (p.name ILIKE $${params.length + 1} OR p.barcode ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    if (category) {
      query += ` AND p.category_id = $${params.length + 1}::bigint`;
      params.push(category);
    }
    
    if (low_stock === 'true') {
      query += ` AND p.quantity <= p.reorder_level`;
    }
    
    query += ` ORDER BY p.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
router.post('/products', authenticateToken, validateProduct, async (req, res) => {
  try {
    const { name, description, price, cost_price, quantity, reorder_level, category_id, barcode, sku } = req.body;
    
    const result = await pool.query(
      `INSERT INTO inventory_product (name, description, price, cost_price, quantity, reorder_level, category_id, barcode, sku, business_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::bigint, $8, $9, $10::bigint, NOW())
       RETURNING *`,
      [name, description, price, cost_price, quantity, reorder_level, category_id, barcode, sku, req.user.business_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Product with this barcode or SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
});

// Update product
router.put('/products/:id', authenticateToken, validateProduct, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, cost_price, quantity, reorder_level, category_id, barcode, sku } = req.body;
    
    const result = await pool.query(
      `UPDATE inventory_product 
       SET name = $1, description = $2, price = $3, cost_price = $4, quantity = $5, 
           reorder_level = $6, category_id = $7::bigint, barcode = $8, sku = $9
       WHERE id = $10::bigint AND business_id = $11::bigint
       RETURNING *`,
      [name, description, price, cost_price, quantity, reorder_level, category_id, barcode, sku, id, req.user.business_id]
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
      'DELETE FROM inventory_product WHERE id = $1::bigint AND business_id = $2::bigint RETURNING id',
      [id, req.user.business_id]
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

// Get categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_category WHERE business_id = $1::bigint ORDER BY name',
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;