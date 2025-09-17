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
      `SELECT t.id, t.status, t.notes, t.created_at, t.completed_at,
              sf.name as from_store_name,
              st.name as to_store_name,
              COUNT(ti.id) as item_count,
              SUM(ti.quantity) as total_quantity
       FROM stores_inventorytransfer t
       LEFT JOIN stores_store sf ON t.from_store_id = sf.id
       LEFT JOIN stores_store st ON t.to_store_id = st.id
       LEFT JOIN stores_transferitem ti ON t.id = ti.transfer_id
       WHERE sf.business_id = $1::bigint OR st.business_id = $1::bigint
       GROUP BY t.id, t.status, t.notes, t.created_at, t.completed_at, sf.name, st.name
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
    
    // Create transfer
    const transferResult = await client.query(
      `INSERT INTO stores_inventorytransfer (from_store_id, to_store_id, notes, status, created_at, created_by_id)
       VALUES ($1::uuid, $2::uuid, $3, 'pending', NOW(), $4::bigint)
       RETURNING *`,
      [from_store_id, to_store_id, notes || '', req.user.id]
    );
    
    const transfer = transferResult.rows[0];
    
    // Create transfer items
    for (const item of items || []) {
      await client.query(
        `INSERT INTO stores_transferitem (transfer_id, product_id, quantity)
         VALUES ($1::uuid, $2::uuid, $3)`,
        [transfer.id, item.product_id, item.quantity]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(transfer);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  } finally {
    client.release();
  }
});

// Approve transfer
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE stores_inventorytransfer 
       SET status = 'approved'
       WHERE id = $1::uuid
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer not found' });
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
      'SELECT * FROM stores_inventorytransfer WHERE id = $1::uuid',
      [id]
    );
    
    if (transferResult.rows.length === 0) {
      throw new Error('Transfer not found');
    }
    
    // Update transfer status
    await client.query(
      `UPDATE stores_inventorytransfer 
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1::uuid`,
      [id]
    );
    
    await client.query('COMMIT');
    res.json({ message: 'Transfer completed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Complete transfer error:', error);
    res.status(500).json({ error: 'Failed to complete transfer' });
  } finally {
    client.release();
  }
});

// Cancel transfer
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE stores_inventorytransfer 
       SET status = 'cancelled'
       WHERE id = $1::uuid
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Cancel transfer error:', error);
    res.status(500).json({ error: 'Failed to cancel transfer' });
  }
});

module.exports = router;