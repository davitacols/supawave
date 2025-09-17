const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get quick stats
router.get('/quick-stats', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.business_id;
    
    // Total products
    const productsResult = await pool.query(
      'SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1::bigint',
      [businessId]
    );
    
    // Low stock count
    const lowStockResult = await pool.query(
      'SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1::bigint AND stock_quantity <= low_stock_threshold',
      [businessId]
    );
    
    // This month's revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueResult = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_sale WHERE business_id = $1::bigint AND created_at >= $2',
      [businessId, monthStart]
    );
    
    res.json({
      total_products: parseInt(productsResult.rows[0].count),
      low_stock_count: parseInt(lowStockResult.rows[0].count),
      monthly_revenue: parseFloat(monthlyRevenueResult.rows[0].total)
    });
  } catch (error) {
    console.error('Quick stats error:', error);
    res.status(500).json({ error: 'Failed to fetch quick stats' });
  }
});

// Get advanced analytics
router.get('/advanced', authenticateToken, async (req, res) => {
  try {
    // Return simple fallback data
    res.json({
      sales_trend: [],
      top_products: [],
      monthly_revenue: []
    });
  } catch (error) {
    console.error('Advanced analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch advanced analytics' });
  }
});

module.exports = router;