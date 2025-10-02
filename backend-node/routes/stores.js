const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all stores
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if stores table exists
    const checkTable = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores')"
    );
    
    if (!checkTable.rows[0].exists) {
      return res.json([]);
    }
    
    let result;
    if (req.user.role === 'owner') {
      // Owners see all their business stores with manager info
      result = await pool.query(
        `SELECT s.id, s.name, s.address, s.phone, s.manager_name, s.is_main_store, s.is_active, s.created_at,
                m.first_name as manager_first_name, m.last_name as manager_last_name, m.email as manager_email
         FROM stores s
         LEFT JOIN accounts_user m ON s.manager_id = m.id
         WHERE s.user_id::text = $1 
         ORDER BY s.is_main_store DESC, s.created_at DESC`,
        [req.user.id.toString()]
      );
    } else if (req.user.role === 'manager') {
      // Managers see only stores they manage
      result = await pool.query(
        `SELECT s.id, s.name, s.address, s.phone, s.manager_name, s.is_main_store, s.is_active, s.created_at
         FROM stores s
         WHERE s.manager_id = $1
         ORDER BY s.is_main_store DESC, s.created_at DESC`,
        [req.user.id]
      );
    } else {
      // Staff see stores they're assigned to
      result = await pool.query(
        `SELECT s.id, s.name, s.address, s.phone, s.manager_name, s.is_main_store, s.is_active, s.created_at
         FROM stores s
         JOIN store_staff ss ON s.id = ss.store_id
         WHERE ss.staff_id = $1 AND ss.is_active = true
         ORDER BY s.is_main_store DESC, s.created_at DESC`,
        [req.user.id]
      );
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Create store
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, address, phone, manager_name, manager_id, is_main_store } = req.body;
    
    // Only owners can create stores
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create stores' });
    }
    
    // Create store with optional manager assignment
    const result = await pool.query(
      `INSERT INTO stores (user_id, name, address, phone, manager_name, manager_id, is_main_store)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id.toString(), name, address, phone, manager_name, manager_id, is_main_store || false]
    );
    
    // If manager assigned, create permissions
    if (manager_id) {
      await pool.query(
        `INSERT INTO manager_permissions (manager_id, store_id, granted_by)
         VALUES ($1, $2, $3)`,
        [manager_id, result.rows[0].id, req.user.id]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Update store
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, address, phone, manager_name, manager_id, is_active } = req.body;
    
    // Check permissions
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can update stores' });
    }
    
    const result = await pool.query(
      `UPDATE stores SET name = $1, address = $2, phone = $3, manager_name = $4, 
       manager_id = $5, is_active = $6, updated_at = NOW() 
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [name, address, phone, manager_name, manager_id, is_active, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Update manager permissions
    if (manager_id) {
      await pool.query(
        `INSERT INTO manager_permissions (manager_id, store_id, granted_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (manager_id, store_id) DO UPDATE SET granted_at = NOW()`,
        [manager_id, req.params.id, req.user.id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// Get store analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  // Prevent caching
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const storeId = req.params.id;
    console.log(`📊 Analytics request for store: ${storeId}`);
    
    // Check if this is the main store
    const storeResult = await pool.query(
      'SELECT name, is_main_store FROM stores WHERE id = $1 AND user_id = $2',
      [storeId, req.user.id.toString()]
    );
    
    if (storeResult.rows.length === 0) {
      console.log(`❌ Store ${storeId} not found`);
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const store = storeResult.rows[0];
    const isMainStore = store.is_main_store;
    console.log(`🏪 Store: ${store.name}, Main: ${isMainStore}`);
    
    if (isMainStore) {
      // Main store gets all business data
      const salesResult = await pool.query(
        `SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue
         FROM sales_sale WHERE business_id = $1`,
        [req.user.business_id.toString()]
      );
      
      const productsResult = await pool.query(
        `SELECT COUNT(*) as total_products, COALESCE(SUM(stock_quantity), 0) as total_inventory
         FROM inventory_product WHERE business_id = $1`,
        [req.user.business_id.toString()]
      );
      
      res.json({
        store_name: store.name,
        is_main: true,
        timestamp: new Date().toISOString(),
        sales: {
          total_sales: parseInt(salesResult.rows[0].total_sales) || 0,
          total_revenue: parseFloat(salesResult.rows[0].total_revenue) || 0
        },
        inventory: {
          total_products: parseInt(productsResult.rows[0].total_products) || 0,
          total_inventory: parseInt(productsResult.rows[0].total_inventory) || 0
        }
      });
    } else {
      // Branch stores start with zero data
      console.log(`📊 Returning zero data for branch store: ${store.name}`);
      res.json({
        store_name: store.name,
        is_main: false,
        timestamp: new Date().toISOString(),
        sales: {
          total_sales: 0,
          total_revenue: 0
        },
        inventory: {
          total_products: 0,
          total_inventory: 0
        }
      });
    }
  } catch (error) {
    console.error('Store analytics error:', error);
    res.json({
      sales: { total_sales: 0, total_revenue: 0 },
      inventory: { total_products: 0, total_inventory: 0 }
    });
  }
});

// Transfer inventory between stores
router.post('/transfer', authenticateToken, async (req, res) => {
  try {
    const { from_store_id, to_store_id, product_id, quantity, notes } = req.body;
    
    const transferResult = await pool.query(
      `INSERT INTO store_transfers (user_id, from_store_id, to_store_id, product_id, quantity, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id.toString(), from_store_id, to_store_id, product_id, quantity, notes]
    );
    
    res.status(201).json(transferResult.rows[0]);
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

// Get transfers
router.get('/transfers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.*, p.name as product_name, fs.name as from_store_name, ts.name as to_store_name
       FROM store_transfers st
       JOIN products p ON st.product_id = p.id
       JOIN stores fs ON st.from_store_id = fs.id
       JOIN stores ts ON st.to_store_id = ts.id
       WHERE st.user_id = $1 ORDER BY st.created_at DESC`,
      [req.user.id.toString()]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.json([]);
  }
});

// Assign manager to store
router.post('/:id/assign-manager/', authenticateToken, async (req, res) => {
  try {
    const { manager_id } = req.body;
    
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can assign managers' });
    }
    
    // Verify manager exists and belongs to business
    const managerCheck = await pool.query(
      `SELECT id FROM accounts_user WHERE id = $1 AND business_id = $2 AND role = 'manager'`,
      [manager_id, req.user.business_id]
    );
    
    if (managerCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid manager' });
    }
    
    // Update store manager
    const result = await pool.query(
      `UPDATE stores SET manager_id = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [manager_id, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Create/update manager permissions
    await pool.query(
      `INSERT INTO manager_permissions (manager_id, store_id, granted_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (manager_id, store_id) DO UPDATE SET granted_at = NOW()`,
      [manager_id, req.params.id, req.user.id]
    );
    
    res.json({ message: 'Manager assigned successfully', store: result.rows[0] });
  } catch (error) {
    console.error('Assign manager error:', error);
    res.status(500).json({ error: 'Failed to assign manager' });
  }
});

// Get available managers for assignment
router.get('/available-managers/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can view managers' });
    }
    
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone_number
       FROM accounts_user 
       WHERE business_id = $1 AND role = 'manager' AND is_active_staff = true
       ORDER BY first_name, last_name`,
      [req.user.business_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

// Assign staff to store
router.post('/:id/assign-staff/', authenticateToken, async (req, res) => {
  try {
    const { staff_id } = req.body;
    
    // Check if user can assign staff (owner or manager of this store)
    let canAssign = false;
    if (req.user.role === 'owner') {
      canAssign = true;
    } else if (req.user.role === 'manager') {
      const managerCheck = await pool.query(
        `SELECT id FROM stores WHERE id = $1 AND manager_id = $2`,
        [req.params.id, req.user.id]
      );
      canAssign = managerCheck.rows.length > 0;
    }
    
    if (!canAssign) {
      return res.status(403).json({ error: 'Not authorized to assign staff to this store' });
    }
    
    // Verify staff exists and belongs to business
    const staffCheck = await pool.query(
      `SELECT id FROM accounts_user WHERE id = $1 AND business_id = $2 AND role IN ('cashier', 'manager')`,
      [staff_id, req.user.business_id]
    );
    
    if (staffCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid staff member' });
    }
    
    // Assign staff to store
    const result = await pool.query(
      `INSERT INTO store_staff (store_id, staff_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (store_id, staff_id) DO UPDATE SET is_active = true, assigned_at = NOW()
       RETURNING *`,
      [req.params.id, staff_id, req.user.id]
    );
    
    res.json({ message: 'Staff assigned successfully', assignment: result.rows[0] });
  } catch (error) {
    console.error('Assign staff error:', error);
    res.status(500).json({ error: 'Failed to assign staff' });
  }
});

// Get store staff
router.get('/:id/staff/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role, ss.assigned_at
       FROM store_staff ss
       JOIN accounts_user u ON ss.staff_id = u.id
       WHERE ss.store_id = $1 AND ss.is_active = true
       ORDER BY u.first_name, u.last_name`,
      [req.params.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get store staff error:', error);
    res.status(500).json({ error: 'Failed to fetch store staff' });
  }
});

// Switch current store (for managers/staff)
router.post('/switch-store/:id/', authenticateToken, async (req, res) => {
  try {
    // Verify user has access to this store
    let hasAccess = false;
    
    if (req.user.role === 'owner') {
      const ownerCheck = await pool.query(
        `SELECT id FROM stores WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );
      hasAccess = ownerCheck.rows.length > 0;
    } else if (req.user.role === 'manager') {
      const managerCheck = await pool.query(
        `SELECT id FROM stores WHERE id = $1 AND manager_id = $2`,
        [req.params.id, req.user.id]
      );
      hasAccess = managerCheck.rows.length > 0;
    } else {
      const staffCheck = await pool.query(
        `SELECT ss.id FROM store_staff ss WHERE ss.store_id = $1 AND ss.staff_id = $2 AND ss.is_active = true`,
        [req.params.id, req.user.id]
      );
      hasAccess = staffCheck.rows.length > 0;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this store' });
    }
    
    // Update user's current store
    await pool.query(
      `UPDATE accounts_user SET current_store_id = $1 WHERE id = $2`,
      [req.params.id, req.user.id]
    );
    
    res.json({ message: 'Store switched successfully' });
  } catch (error) {
    console.error('Switch store error:', error);
    res.status(500).json({ error: 'Failed to switch store' });
  }
});

module.exports = router;