const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all products
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const { search, category, low_stock, page = 1, limit = 1000 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT *,
             CASE WHEN stock_quantity <= low_stock_threshold THEN true ELSE false END as is_low_stock
      FROM inventory_product
      WHERE business_id = $1::bigint
    `;
    const params = [req.user.business_id];
    
    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR barcode ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    if (category) {
      query += ` AND category_id = $${params.length + 1}`;
      params.push(category);
    }
    
    if (low_stock === 'true') {
      query += ` AND stock_quantity <= low_stock_threshold`;
    }
    
    query += ` ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    console.log('🔍 Executing query:', query);
    console.log('🔍 With params:', params);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM inventory_product WHERE business_id = $1::bigint`;
    const countParams = [req.user.business_id];
    
    if (search) {
      countQuery += ` AND (name ILIKE $2 OR barcode ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    // For POS compatibility, return just the array if no pagination params
    if (req.query.page || req.query.limit) {
      res.json({
        products: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
router.post('/products', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('📦 Create product request body:', req.body);
    
    // Handle both JSON and FormData
    const name = req.body.name;
    const selling_price = req.body.selling_price;
    const cost_price = req.body.cost_price;
    const stock_quantity = req.body.stock_quantity;
    const low_stock_threshold = req.body.low_stock_threshold;
    const category = req.body.category;
    const supplier = req.body.supplier;
    const sku = req.body.sku;
    
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    
    // Generate UUID for id
    const productId = uuidv4();
    
    // Generate SKU if not provided
    const finalSku = sku || `SKU-${Date.now()}`;
    
    // Generate barcode if not provided (13 digits max)
    const barcode = Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');
    
    const result = await pool.query(
      `INSERT INTO inventory_product (id, name, sku, barcode, cost_price, selling_price, stock_quantity, 
                                      low_stock_threshold, reorder_point, max_stock, is_active, 
                                      created_at, updated_at, business_id, category_id, supplier_id)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW(), $11::bigint, $12::uuid, $13::uuid)
       RETURNING *`,
      [productId, name, finalSku, barcode, cost_price, selling_price, stock_quantity, 
       low_stock_threshold || 10, low_stock_threshold || 5, 1000, req.user.business_id, 
       category || null, supplier || null]
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
router.put('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, cost_price, quantity, reorder_level, category_id, barcode, sku } = req.body;
    
    const result = await pool.query(
      `UPDATE inventory_product 
       SET name = $1, cost_price = $2, selling_price = $3, stock_quantity = $4, 
           low_stock_threshold = $5, category_id = $6::uuid, barcode = $7, sku = $8
       WHERE id = $9::uuid AND business_id = $10::bigint
       RETURNING *`,
      [name, cost_price, price, quantity, reorder_level, category_id, barcode, sku, id, req.user.business_id]
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
      'DELETE FROM inventory_product WHERE id = $1::uuid AND business_id = $2::bigint RETURNING id',
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

// Get low stock products
router.get('/products/low-stock', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, sku, barcode, stock_quantity, low_stock_threshold, selling_price
       FROM inventory_product
       WHERE business_id = $1::bigint AND stock_quantity <= low_stock_threshold
       ORDER BY name`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Get all products for POS (no pagination)
router.get('/products/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, sku, barcode, stock_quantity, selling_price, cost_price, is_active
       FROM inventory_product
       WHERE business_id = $1::bigint AND is_active = true
       ORDER BY name`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Failed to fetch all products' });
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

// Get suppliers
router.get('/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_supplier WHERE business_id = $1::bigint ORDER BY name',
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Smart reorder suggestions
router.get('/smart-reorder', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, sku, stock_quantity, low_stock_threshold, reorder_point,
              (reorder_point - stock_quantity) as suggested_quantity,
              selling_price, cost_price
       FROM inventory_product
       WHERE business_id = $1::bigint 
       AND stock_quantity <= reorder_point
       AND is_active = true
       ORDER BY (reorder_point - stock_quantity) DESC`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Smart reorder error:', error);
    res.status(500).json({ error: 'Failed to fetch reorder suggestions' });
  }
});

// Stock take
router.get('/stock-take', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, sku, barcode, stock_quantity as current_stock, 
              selling_price, cost_price,
              stock_quantity as counted_quantity,
              0 as variance,
              is_active
       FROM inventory_product
       WHERE business_id = $1::bigint AND is_active = true
       ORDER BY name`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Stock take error:', error);
    res.status(500).json({ error: 'Failed to fetch stock take data' });
  }
});

// Get all stock takes
router.get('/stock-takes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.id, st.name, st.status, st.created_at, st.completed_at,
              st.notes, c.name as category_name,
              COUNT(sti.id) as total_items,
              COUNT(CASE WHEN sti.actual_quantity > 0 THEN 1 END) as counted_items
       FROM inventory_stocktake st
       LEFT JOIN inventory_category c ON st.category_id = c.id
       LEFT JOIN inventory_stocktakeitem sti ON st.id = sti.stock_take_id
       WHERE st.business_id = $1::bigint
       GROUP BY st.id, st.name, st.status, st.created_at, st.completed_at, st.notes, c.name
       ORDER BY st.created_at DESC`,
      [req.user.business_id]
    );
    
    // Calculate progress for each stock take
    const stockTakes = result.rows.map(st => ({
      ...st,
      progress: st.total_items > 0 ? Math.round((st.counted_items / st.total_items) * 100) : 0
    }));
    
    res.json(stockTakes);
  } catch (error) {
    console.error('Get stock takes error:', error);
    res.status(500).json({ error: 'Failed to fetch stock takes' });
  }
});

// Update stock take
router.post('/stock-take', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    
    for (const item of items) {
      await pool.query(
        'UPDATE inventory_product SET stock_quantity = $1 WHERE id = $2::uuid AND business_id = $3::bigint',
        [item.counted_quantity, item.id, req.user.business_id]
      );
    }
    
    res.json({ message: 'Stock take completed successfully' });
  } catch (error) {
    console.error('Update stock take error:', error);
    res.status(500).json({ error: 'Failed to update stock take' });
  }
});

// Update stock takes (plural)
router.post('/stock-takes', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    
    for (const item of items) {
      await pool.query(
        'UPDATE inventory_product SET stock_quantity = $1 WHERE id = $2::uuid AND business_id = $3::bigint',
        [item.counted_quantity, item.id, req.user.business_id]
      );
    }
    
    res.json({ message: 'Stock take completed successfully' });
  } catch (error) {
    console.error('Update stock take error:', error);
    res.status(500).json({ error: 'Failed to update stock take' });
  }
});

// Get inventory alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name as product_name, p.stock_quantity as current_stock,
              p.low_stock_threshold, p.reorder_point,
              CASE 
                WHEN p.stock_quantity = 0 THEN 'critical'
                WHEN p.stock_quantity <= p.reorder_point THEN 'high'
                WHEN p.stock_quantity <= p.low_stock_threshold THEN 'medium'
                ELSE 'low'
              END as priority,
              CASE 
                WHEN p.stock_quantity = 0 THEN 'Product is out of stock'
                WHEN p.stock_quantity <= p.reorder_point THEN 'Stock critically low - immediate reorder needed'
                WHEN p.stock_quantity <= p.low_stock_threshold THEN 'Stock running low'
                ELSE 'Stock levels normal'
              END as message,
              (p.reorder_point - p.stock_quantity + 10) as suggested_order_quantity
       FROM inventory_product p
       WHERE p.business_id = $1::bigint 
       AND p.stock_quantity <= p.low_stock_threshold
       AND p.is_active = true
       ORDER BY 
         CASE 
           WHEN p.stock_quantity = 0 THEN 1
           WHEN p.stock_quantity <= p.reorder_point THEN 2
           WHEN p.stock_quantity <= p.low_stock_threshold THEN 3
           ELSE 4
         END, p.stock_quantity ASC`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get reorder recommendations
router.get('/alerts/recommendations', authenticateToken, async (req, res) => {
  try {
    // Return empty recommendations for now
    res.json([]);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Generate alerts
router.post('/alerts/generate_alerts', authenticateToken, async (req, res) => {
  try {
    // For now, just return success - alerts are generated automatically by the GET /alerts endpoint
    res.json({ message: 'Alerts generated successfully' });
  } catch (error) {
    console.error('Generate alerts error:', error);
    res.status(500).json({ error: 'Failed to generate alerts' });
  }
});

// Dismiss alert
router.post('/alerts/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    // For now, just return success
    res.json({ message: 'Alert dismissed successfully' });
  } catch (error) {
    console.error('Dismiss alert error:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

// Get purchase orders
router.get('/purchase-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM inventory_purchaseorder 
       WHERE business_id = $1::bigint 
       ORDER BY created_at DESC`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Get specific stock take by ID
router.get('/stock-takes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get stock take details
    const stockTakeResult = await pool.query(
      `SELECT st.*, c.name as category_name
       FROM inventory_stocktake st
       LEFT JOIN inventory_category c ON st.category_id = c.id
       WHERE st.id = $1::uuid AND st.business_id = $2::bigint`,
      [id, req.user.business_id]
    );
    
    if (stockTakeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stock take not found' });
    }
    
    const stockTake = stockTakeResult.rows[0];
    
    // Get stock take items with product details
    const itemsResult = await pool.query(
      `SELECT sti.id, sti.expected_quantity as system_count, 
              sti.actual_quantity as physical_count, sti.variance,
              sti.variance_reason, sti.notes, sti.product_id as product,
              p.name as product_name, p.sku as product_sku, p.barcode
       FROM inventory_stocktakeitem sti
       JOIN inventory_product p ON sti.product_id = p.id
       WHERE sti.stock_take_id = $1::uuid
       ORDER BY p.name`,
      [id]
    );
    
    const response = {
      id: stockTake.id,
      name: stockTake.name,
      status: stockTake.status,
      category_name: stockTake.category_name,
      created_at: stockTake.created_at,
      completed_at: stockTake.completed_at,
      notes: stockTake.notes,
      items: itemsResult.rows
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get stock take error:', error);
    res.status(500).json({ error: 'Failed to fetch stock take' });
  }
});

// Get stock take summary
router.get('/stock-takes/:id/summary', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get summary data from stock take items
    const summaryResult = await pool.query(
      `SELECT 
         COUNT(*) as total_items,
         COUNT(CASE WHEN actual_quantity > 0 THEN 1 END) as counted_items,
         COUNT(CASE WHEN variance != 0 THEN 1 END) as variance_items
       FROM inventory_stocktakeitem 
       WHERE stock_take_id = $1::uuid`,
      [id]
    );
    
    if (summaryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stock take not found' });
    }
    
    const summary = summaryResult.rows[0];
    const totalItems = parseInt(summary.total_items);
    const countedItems = parseInt(summary.counted_items);
    const varianceItems = parseInt(summary.variance_items);
    const remainingItems = totalItems - countedItems;
    const progress = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;
    
    res.json({
      total_items: totalItems,
      counted_items: countedItems,
      remaining_items: remainingItems,
      variance_items: varianceItems,
      progress: Math.round(progress * 100) / 100
    });
  } catch (error) {
    console.error('Get stock take summary error:', error);
    res.status(500).json({ error: 'Failed to fetch stock take summary' });
  }
});

// Update stock take count
router.post('/stock-takes/:id/count', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, physical_count, variance_reason, notes } = req.body;
    
    // First check if the stock take item exists
    const existingItem = await pool.query(
      `SELECT id, expected_quantity FROM inventory_stocktakeitem 
       WHERE stock_take_id = $1::uuid AND product_id = $2::uuid`,
      [id, product_id]
    );
    
    if (existingItem.rows.length === 0) {
      return res.status(404).json({ error: 'Stock take item not found' });
    }
    
    const expectedQuantity = existingItem.rows[0].expected_quantity;
    const variance = physical_count - expectedQuantity;
    
    // Update the stock take item
    await pool.query(
      `UPDATE inventory_stocktakeitem 
       SET actual_quantity = $1, variance = $2, variance_reason = $3, 
           notes = $4, counted_at = NOW()
       WHERE stock_take_id = $5::uuid AND product_id = $6::uuid`,
      [physical_count, variance, variance_reason || '', notes || '', id, product_id]
    );
    
    res.json({ 
      message: 'Count updated successfully',
      variance: variance
    });
  } catch (error) {
    console.error('Update stock take count error:', error);
    res.status(500).json({ error: 'Failed to update count' });
  }
});

// Update stock take status (complete, etc.)
router.put('/stock-takes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updateData = { status };
    if (status === 'completed') {
      updateData.completed_at = 'NOW()';
    }
    
    const result = await pool.query(
      `UPDATE inventory_stocktake 
       SET status = $1, completed_at = ${status === 'completed' ? 'NOW()' : 'completed_at'}
       WHERE id = $2::uuid AND business_id = $3::bigint
       RETURNING *`,
      [status, id, req.user.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock take not found' });
    }
    
    // If completing, update product quantities based on actual counts
    if (status === 'completed') {
      await pool.query(
        `UPDATE inventory_product 
         SET stock_quantity = sti.actual_quantity
         FROM inventory_stocktakeitem sti
         WHERE inventory_product.id = sti.product_id 
         AND sti.stock_take_id = $1::uuid
         AND inventory_product.business_id = $2::bigint`,
        [id, req.user.business_id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update stock take error:', error);
    res.status(500).json({ error: 'Failed to update stock take' });
  }
});

// Barcode lookup
router.get('/products/barcode/:barcode', authenticateToken, async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM inventory_product 
       WHERE business_id = $1::bigint AND barcode = $2 AND is_active = true`,
      [req.user.business_id, barcode]
    );
    
    if (result.rows.length > 0) {
      res.json({
        found: true,
        product: result.rows[0]
      });
    } else {
      res.json({
        found: false,
        product: null
      });
    }
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
});

module.exports = router;