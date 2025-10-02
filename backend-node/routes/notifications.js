const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create notifications table if it doesn't exist
const createNotificationsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        business_id BIGINT NOT NULL,
        user_id BIGINT,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        priority VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT NOW(),
        read_at TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error creating notifications table:', error);
  }
};

// Initialize table
createNotificationsTable();

// Get notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT * FROM notifications 
      WHERE business_id = $1
    `;
    let params = [req.user.business_id];
    
    if (unread_only === 'true') {
      query += ' AND is_read = false';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get unread count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE business_id = $1 AND is_read = false',
      [req.user.business_id]
    );
    
    res.json({
      notifications: result.rows,
      unread_count: parseInt(unreadResult.rows[0].count),
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create notification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, title, message, data, priority = 'medium', user_id } = req.body;
    
    const result = await pool.query(`
      INSERT INTO notifications (business_id, user_id, type, title, message, data, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [req.user.business_id, user_id, type, title, message, JSON.stringify(data), priority]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE notifications 
      SET is_read = true, read_at = NOW() 
      WHERE id = $1 AND business_id = $2 
      RETURNING *
    `, [id, req.user.business_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await pool.query(`
      UPDATE notifications 
      SET is_read = true, read_at = NOW() 
      WHERE business_id = $1 AND is_read = false
    `, [req.user.business_id]);
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      DELETE FROM notifications 
      WHERE id = $1 AND business_id = $2 
      RETURNING *
    `, [id, req.user.business_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Utility function to create notifications
const createNotification = async (businessId, type, title, message, data = null, priority = 'medium', userId = null) => {
  try {
    await pool.query(`
      INSERT INTO notifications (business_id, user_id, type, title, message, data, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [businessId, userId, type, title, message, JSON.stringify(data), priority]);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = { router, createNotification };