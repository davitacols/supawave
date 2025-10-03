const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  req.user = { id: 1, business_id: 1, role: 'owner' };
  next();
};

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SupaWave API is running' });
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    res.json({
      todayStats: { sales: 0, revenue: 0, customers: 0, orders: 0 },
      weeklyStats: { sales: 0, revenue: 0, customers: 0, orders: 0 },
      monthlyStats: { sales: 0, revenue: 0, customers: 0, orders: 0 },
      inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, categories: 0 },
      recentSales: [],
      topProducts: [],
      salesTrend: [],
      alerts: []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Inventory products
app.get('/api/inventory/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory_product WHERE business_id = $1', [req.user.business_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Low stock products
app.get('/api/inventory/products/low-stock', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_product WHERE business_id = $1 AND stock_quantity <= low_stock_threshold',
      [req.user.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Stores
app.get('/api/stores', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores WHERE business_id = $1', [req.user.business_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Transfers
app.get('/api/transfers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory_transfers WHERE business_id = $1', [req.user.business_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

// Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    res.json({ notifications: [], unread_count: 0, total: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Forecasting dashboard
app.get('/api/forecasting/dashboard', authenticateToken, async (req, res) => {
  try {
    res.json({
      critical_stockouts: 0,
      high_priority_reorders: 0,
      total_recommendations: 0,
      estimated_reorder_cost: 0,
      recommendations: []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forecasting data' });
  }
});

// Auth business
app.get('/api/auth/business', authenticateToken, async (req, res) => {
  try {
    res.json({ id: 1, name: 'Test Business', subscription_status: 'active' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;