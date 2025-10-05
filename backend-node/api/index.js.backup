const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Enhanced CORS middleware to handle all preflight requests
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false, // Set to false when using origin: true
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Additional OPTIONS handler for preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.sendStatus(200);
});

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

// Auth login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM accounts_user WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const token = 'fake-jwt-token';
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        role: 'owner',
        business_id: user.id
      },
      tokens: {
        access: token,
        refresh: token
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Auth register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, business_name } = req.body;
    
    const result = await pool.query(
      'INSERT INTO accounts_user (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, password, first_name, last_name]
    );
    
    const user = result.rows[0];
    const token = 'fake-jwt-token';
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        role: 'owner',
        business_id: user.id
      },
      tokens: {
        access: token,
        refresh: token
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Auth business
app.get('/api/auth/business', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts_business WHERE id = $1', [req.user.business_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    res.json(result.rows[0]);
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