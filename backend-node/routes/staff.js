const express = require('express');
const { Pool } = require('pg');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateStaff } = require('../middleware/validation');
require('dotenv').config();
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get all staff
router.get('/', authenticateToken, async (req, res) => {
  try {
    let staffResult;
    
    if (req.user.role === 'owner') {
      // Owners see all business staff
      staffResult = await pool.query(
        `SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.phone_number, 
                u.role, u.is_active_staff, u.current_store_id, s.name as current_store_name
         FROM accounts_user u
         LEFT JOIN stores s ON u.current_store_id = s.id
         WHERE u.business_id = $1 AND u.role IN ('manager', 'cashier')
         ORDER BY u.first_name, u.last_name`,
        [req.user.business_id]
      );
    } else if (req.user.role === 'manager') {
      // Managers see staff in their stores
      staffResult = await pool.query(
        `SELECT DISTINCT u.id, u.username, u.first_name, u.last_name, u.email, 
                u.phone_number, u.role, u.is_active_staff, u.current_store_id, 
                s.name as current_store_name
         FROM accounts_user u
         LEFT JOIN stores s ON u.current_store_id = s.id
         JOIN store_staff ss ON u.id = ss.staff_id
         JOIN stores st ON ss.store_id = st.id
         WHERE st.manager_id = $1 AND ss.is_active = true AND u.role = 'cashier'
         ORDER BY u.first_name, u.last_name`,
        [req.user.id]
      );
    } else {
      // Regular staff can't view other staff
      return res.status(403).json({ error: 'Not authorized to view staff' });
    }
    
    const response = {
      data: staffResult.rows,
      results: staffResult.rows,
      count: staffResult.rows.length
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Create staff (only owners and managers)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { username, email, first_name, last_name, role, phone_number, password, store_id } = req.body;
    
    // Check permissions
    if (req.user.role === 'manager') {
      // Managers can only create cashiers for their stores
      if (role !== 'cashier') {
        return res.status(403).json({ error: 'Managers can only create cashiers' });
      }
      
      // Verify manager has access to the store
      if (store_id) {
        const storeCheck = await pool.query(
          `SELECT id FROM stores WHERE id = $1 AND manager_id = $2`,
          [store_id, req.user.id]
        );
        if (storeCheck.rows.length === 0) {
          return res.status(403).json({ error: 'Not authorized for this store' });
        }
      }
    } else if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Not authorized to create staff' });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'temp123', 10);
    
    // Create staff member
    const staffResult = await pool.query(
      `INSERT INTO accounts_user (username, email, password, first_name, last_name, role, 
                                  phone_number, business_id, is_active_staff, date_joined, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), true)
       RETURNING id, username, first_name, last_name, email, role`,
      [username, email, hashedPassword, first_name, last_name, role, phone_number, req.user.business_id]
    );
    
    const newStaff = staffResult.rows[0];
    
    // Assign to store if specified
    if (store_id) {
      await pool.query(
        `INSERT INTO store_staff (store_id, staff_id, assigned_by)
         VALUES ($1, $2, $3)`,
        [store_id, newStaff.id, req.user.id]
      );
    }
    
    res.status(201).json({
      message: 'Staff created successfully',
      staff: newStaff
    });
  } catch (error) {
    console.error('Create staff error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create staff' });
    }
  }
});

// Update staff
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone_number, role, is_active_staff } = req.body;
    
    // Check permissions
    if (req.user.role === 'manager') {
      // Managers can only update cashiers in their stores
      const staffCheck = await pool.query(
        `SELECT u.id FROM accounts_user u
         JOIN store_staff ss ON u.id = ss.staff_id
         JOIN stores s ON ss.store_id = s.id
         WHERE u.id = $1 AND s.manager_id = $2 AND u.role = 'cashier'`,
        [req.params.id, req.user.id]
      );
      if (staffCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Not authorized to update this staff member' });
      }
    } else if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Not authorized to update staff' });
    }
    
    const result = await pool.query(
      `UPDATE accounts_user 
       SET first_name = $1, last_name = $2, email = $3, phone_number = $4, 
           role = $5, is_active_staff = $6
       WHERE id = $7 AND business_id = $8
       RETURNING id, username, first_name, last_name, email, role, is_active_staff`,
      [first_name, last_name, email, phone_number, role, is_active_staff, req.params.id, req.user.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    res.json({
      message: 'Staff updated successfully',
      staff: result.rows[0]
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// Delete staff
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Only owners can delete staff
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete staff' });
    }
    
    // Soft delete by deactivating
    const result = await pool.query(
      `UPDATE accounts_user 
       SET is_active_staff = false, is_active = false
       WHERE id = $1 AND business_id = $2
       RETURNING id`,
      [req.params.id, req.user.business_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    // Remove from store assignments
    await pool.query(
      `UPDATE store_staff SET is_active = false WHERE staff_id = $1`,
      [req.params.id]
    );
    
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

module.exports = router;