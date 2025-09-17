const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Public dashboard stats for testing
router.get('/stats-public', async (req, res) => {
  try {
    res.json({
      todayStats: {
        sales: 0,
        revenue: 0,
        customers: 0,
        orders: 0
      },
      weeklyStats: {
        sales: 5,
        revenue: 125000,
        customers: 12,
        orders: 8
      },
      monthlyStats: {
        sales: 36,
        revenue: 850000,
        customers: 45,
        orders: 36
      },
      inventory: {
        totalProducts: 1107,
        lowStock: 15,
        outOfStock: 3,
        categories: 22
      },
      recentSales: [],
      topProducts: [],
      alerts: [
        {
          type: 'info',
          message: 'Welcome back to SupaWave! (Public endpoint)',
          timestamp: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get dashboard data
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.business_id;
    console.log('📊 Dashboard request for business:', businessId);
    console.log('📊 User object:', req.user);
    
    // Test query to verify business ID
    const testQuery = await pool.query('SELECT COUNT(*) as count FROM sales_sale WHERE business_id = $1::bigint', [businessId]);
    console.log('📊 Sales count for this business:', testQuery.rows[0].count);
    
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Today's stats
    const todayResult = await pool.query(
      `SELECT COUNT(*) as sales, COALESCE(SUM(total_amount), 0) as revenue
       FROM sales_sale WHERE business_id = $1::bigint AND DATE(created_at) = $2`,
      [businessId, today]
    );
    
    // Weekly stats
    const weeklyResult = await pool.query(
      `SELECT COUNT(*) as sales, COALESCE(SUM(total_amount), 0) as revenue
       FROM sales_sale WHERE business_id = $1::bigint AND created_at >= $2`,
      [businessId, weekAgo]
    );
    
    // Monthly stats
    const monthlyResult = await pool.query(
      `SELECT COUNT(*) as sales, COALESCE(SUM(total_amount), 0) as revenue
       FROM sales_sale WHERE business_id = $1::bigint AND created_at >= $2`,
      [businessId, monthAgo]
    );
    
    // Inventory stats
    const inventoryResult = await pool.query(
      `SELECT 
         COUNT(*) as total_products,
         COUNT(CASE WHEN stock_quantity <= low_stock_threshold AND stock_quantity > 0 THEN 1 END) as low_stock,
         COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock
       FROM inventory_product WHERE business_id = $1::bigint AND is_active = true`,
      [businessId]
    );
    
    // Categories count
    const categoriesResult = await pool.query(
      'SELECT COUNT(*) as count FROM inventory_category WHERE business_id = $1::bigint',
      [businessId]
    );
    
    // Recent sales
    const recentSalesResult = await pool.query(
      `SELECT s.id, s.total_amount, s.created_at, s.customer_phone
       FROM sales_sale s
       WHERE s.business_id = $1::bigint
       ORDER BY s.created_at DESC LIMIT 5`,
      [businessId]
    );
    
    console.log('📊 Recent sales found:', recentSalesResult.rows.length);
    
    // Top products (by sales volume)
    const topProductsResult = await pool.query(
      `SELECT p.name, COUNT(si.id) as sales_count, SUM(si.quantity) as total_quantity
       FROM sales_saleitem si
       JOIN inventory_product p ON si.product_id = p.id
       JOIN sales_sale s ON si.sale_id = s.id
       WHERE s.business_id = $1::bigint AND s.created_at >= $2
       GROUP BY p.id, p.name
       ORDER BY sales_count DESC LIMIT 5`,
      [businessId, monthAgo]
    );
    
    console.log('📊 Top products found:', topProductsResult.rows.length);
    
    // Sales trend (last 7 days)
    const salesTrendResult = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as sales, SUM(total_amount) as revenue
       FROM sales_sale
       WHERE business_id = $1::bigint AND created_at >= $2
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [businessId, weekAgo]
    );
    
    console.log('📊 Sales trend found:', salesTrendResult.rows.length, 'days');
    console.log('📊 Monthly stats:', monthlyResult.rows[0]);
    
    res.json({
      todayStats: {
        sales: parseInt(todayResult.rows[0].sales),
        revenue: parseFloat(todayResult.rows[0].revenue),
        customers: 0, // Would need customer tracking
        orders: parseInt(todayResult.rows[0].sales)
      },
      weeklyStats: {
        sales: parseInt(weeklyResult.rows[0].sales),
        revenue: parseFloat(weeklyResult.rows[0].revenue),
        customers: 0,
        orders: parseInt(weeklyResult.rows[0].sales)
      },
      monthlyStats: {
        sales: parseInt(monthlyResult.rows[0].sales),
        revenue: parseFloat(monthlyResult.rows[0].revenue),
        customers: 0,
        orders: parseInt(monthlyResult.rows[0].sales)
      },
      inventory: {
        totalProducts: parseInt(inventoryResult.rows[0].total_products),
        lowStock: parseInt(inventoryResult.rows[0].low_stock),
        outOfStock: parseInt(inventoryResult.rows[0].out_of_stock),
        categories: parseInt(categoriesResult.rows[0].count)
      },
      recentSales: recentSalesResult.rows,
      topProducts: topProductsResult.rows,
      salesTrend: salesTrendResult.rows,
      alerts: [
        {
          type: 'info',
          message: 'Dashboard data updated with real business metrics',
          timestamp: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;