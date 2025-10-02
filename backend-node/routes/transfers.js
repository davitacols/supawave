const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all transfers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.status, t.notes, t.created_at, t.approved_at, t.completed_at,
              sf.name as from_store_name, st.name as to_store_name,
              uc.first_name as created_by_name, ua.first_name as approved_by_name,
              COUNT(ti.id) as item_count, SUM(ti.quantity) as total_quantity
       FROM inventory_transfers t
       LEFT JOIN stores sf ON t.from_store_id = sf.id
       LEFT JOIN stores st ON t.to_store_id = st.id
       LEFT JOIN accounts_user uc ON t.created_by = uc.id
       LEFT JOIN accounts_user ua ON t.approved_by = ua.id
       LEFT JOIN transfer_items ti ON t.id = ti.transfer_id
       WHERE t.business_id = $1
       GROUP BY t.id, t.status, t.notes, t.created_at, t.approved_at, t.completed_at, 
                sf.name, st.name, uc.first_name, ua.first_name
       ORDER BY t.created_at DESC`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

// Create transfer
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { from_store_id, to_store_id, items, notes } = req.body;
    
    // Validate stores belong to business
    const storeCheck = await client.query(
      `SELECT COUNT(*) as count FROM stores 
       WHERE (id = $1 OR id = $2) AND user_id = $3`,
      [from_store_id, to_store_id, req.user.id]
    );
    
    if (parseInt(storeCheck.rows[0].count) !== 2) {
      throw new Error('Invalid stores selected');
    }
    
    // Create transfer
    const transferResult = await client.query(
      `INSERT INTO inventory_transfers (business_id, from_store_id, to_store_id, notes, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.business_id, from_store_id, to_store_id, notes || '', req.user.id]
    );
    
    const transfer = transferResult.rows[0];
    
    // Create transfer items
    for (const item of items || []) {
      // Check stock availability from main inventory
      const stockCheck = await client.query(
        `SELECT p.name, p.stock_quantity
         FROM inventory_product p
         WHERE p.id = $1 AND p.business_id = $2`,
        [item.product_id, req.user.business_id]
      );
      
      console.log('Stock check result:', stockCheck.rows);
      console.log('Product ID:', item.product_id, 'Business ID:', req.user.business_id);
      
      if (stockCheck.rows.length === 0) {
        throw new Error(`Product not found`);
      }
      
      const product = stockCheck.rows[0];
      const available = parseInt(product.stock_quantity || 0);
      
      console.log(`Product: ${product.name}, Available: ${available}, Requested: ${item.quantity}`);
      
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${available}, Requested: ${item.quantity}`);
      }
      
      await client.query(
        `INSERT INTO transfer_items (transfer_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [transfer.id, item.product_id, item.quantity]
      );
      
      // Initialize store inventory with main inventory quantity
      await client.query(
        `INSERT INTO store_inventory (store_id, product_id, quantity, reserved_quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (store_id, product_id) 
         DO UPDATE SET reserved_quantity = store_inventory.reserved_quantity + $4`,
        [from_store_id, item.product_id, available, item.quantity]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(transfer);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create transfer error:', error);
    res.status(500).json({ error: error.message || 'Failed to create transfer' });
  } finally {
    client.release();
  }
});

// Approve transfer
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE inventory_transfers 
       SET status = 'approved', approved_by = $2, approved_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer not found or already processed' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Approve transfer error:', error);
    res.status(500).json({ error: 'Failed to approve transfer' });
  }
});

// Complete transfer
router.post('/:id/complete', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Get transfer details
    const transferResult = await client.query(
      `SELECT * FROM inventory_transfers 
       WHERE id = $1 AND business_id = $2 AND status = 'approved'`,
      [id, req.user.business_id]
    );
    
    if (transferResult.rows.length === 0) {
      throw new Error('Transfer not found or not approved');
    }
    
    const transfer = transferResult.rows[0];
    
    // Get transfer items
    const itemsResult = await client.query(
      `SELECT * FROM transfer_items WHERE transfer_id = $1`,
      [id]
    );
    
    // Process inventory movements
    for (const item of itemsResult.rows) {
      // Remove from source store
      await client.query(
        `UPDATE store_inventory 
         SET quantity = quantity - $3, reserved_quantity = reserved_quantity - $3
         WHERE store_id = $1 AND product_id = $2`,
        [transfer.from_store_id, item.product_id, item.quantity]
      );
      
      // Add to destination store
      await client.query(
        `INSERT INTO store_inventory (store_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (store_id, product_id)
         DO UPDATE SET quantity = store_inventory.quantity + $3, last_updated = NOW()`,
        [transfer.to_store_id, item.product_id, item.quantity]
      );
    }
    
    // Update transfer status
    await client.query(
      `UPDATE inventory_transfers 
       SET status = 'completed', completed_by = $2, completed_at = NOW()
       WHERE id = $1`,
      [id, req.user.id]
    );
    
    await client.query('COMMIT');
    res.json({ message: 'Transfer completed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Complete transfer error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete transfer' });
  } finally {
    client.release();
  }
});

// Cancel transfer
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Get transfer details
    const transferResult = await client.query(
      `SELECT * FROM inventory_transfers 
       WHERE id = $1 AND business_id = $2 AND status IN ('pending', 'approved')`,
      [id, req.user.business_id]
    );
    
    if (transferResult.rows.length === 0) {
      throw new Error('Transfer not found or cannot be cancelled');
    }
    
    const transfer = transferResult.rows[0];
    
    // Release reserved stock if transfer was pending
    if (transfer.status === 'pending' || transfer.status === 'approved') {
      const itemsResult = await client.query(
        `SELECT * FROM transfer_items WHERE transfer_id = $1`,
        [id]
      );
      
      for (const item of itemsResult.rows) {
        await client.query(
          `UPDATE store_inventory 
           SET reserved_quantity = reserved_quantity - $3
           WHERE store_id = $1 AND product_id = $2`,
          [transfer.from_store_id, item.product_id, item.quantity]
        );
      }
    }
    
    // Update transfer status
    const result = await client.query(
      `UPDATE inventory_transfers 
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel transfer error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel transfer' });
  } finally {
    client.release();
  }
});

// Get store inventory
router.get('/store-inventory/:storeId', authenticateToken, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const result = await pool.query(
      `SELECT p.id, p.name, p.sku, p.selling_price, p.cost_price,
              COALESCE(si.quantity, 0) as quantity,
              COALESCE(si.reserved_quantity, 0) as reserved_quantity,
              (COALESCE(si.quantity, 0) - COALESCE(si.reserved_quantity, 0)) as available_quantity
       FROM inventory_product p
       LEFT JOIN store_inventory si ON p.id = si.product_id AND si.store_id = $1
       WHERE p.business_id = $2 AND p.is_active = true
       ORDER BY p.name`,
      [storeId, req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get store inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch store inventory' });
  }
});

// Get transfer details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const transferResult = await pool.query(
      `SELECT t.*, sf.name as from_store_name, st.name as to_store_name,
              uc.first_name as created_by_name, ua.first_name as approved_by_name,
              ucm.first_name as completed_by_name
       FROM inventory_transfers t
       LEFT JOIN stores sf ON t.from_store_id = sf.id
       LEFT JOIN stores st ON t.to_store_id = st.id
       LEFT JOIN accounts_user uc ON t.created_by = uc.id
       LEFT JOIN accounts_user ua ON t.approved_by = ua.id
       LEFT JOIN accounts_user ucm ON t.completed_by = ucm.id
       WHERE t.id = $1 AND t.business_id = $2`,
      [id, req.user.business_id]
    );
    
    if (transferResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    
    const itemsResult = await pool.query(
      `SELECT ti.*, p.name as product_name, p.sku
       FROM transfer_items ti
       JOIN inventory_product p ON ti.product_id = p.id
       WHERE ti.transfer_id = $1`,
      [id]
    );
    
    res.json({
      transfer: transferResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Get transfer details error:', error);
    res.status(500).json({ error: 'Failed to fetch transfer details' });
  }
});

module.exports = router;