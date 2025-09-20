const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Simple auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    // Simple token parsing for both JWT and base64 tokens
    if (token.includes('.')) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        req.user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role || 'owner',
          business_id: payload.businessId || payload.userId
        };
      }
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userResult = await pool.query(
      'SELECT id, username, email, first_name, last_name, business_id, role FROM accounts_user WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Create simple token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.business_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400
    };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadStr = btoa(JSON.stringify(payload));
    const signature = btoa('signature-' + Date.now());
    const token = `${header}.${payloadStr}.${signature}`;
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        business_id: user.business_id
      },
      tokens: {
        access: token,
        refresh: 'refresh-' + token,
        expiresIn: 86400
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Business info
app.get('/api/auth/business', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone_number, 
              b.name as business_name, b.registration_date,
              CASE 
                WHEN NOW() <= b.trial_end_date THEN 'trial'
                ELSE 'expired'
              END as subscription_status,
              GREATEST(0, EXTRACT(days FROM b.trial_end_date - NOW())::int) as trial_days_left
       FROM accounts_user u 
       LEFT JOIN accounts_business b ON u.business_id = b.id 
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Business not found' });
    }
  } catch (error) {
    console.error('Business fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch business info' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.business_id;
    
    const salesResult = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales_sale WHERE business_id = $1::bigint',
      [businessId]
    );
    
    const productsResult = await pool.query(
      'SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1::bigint',
      [businessId]
    );
    
    res.json({
      totalSales: parseInt(salesResult.rows[0].count || 0),
      totalRevenue: parseFloat(salesResult.rows[0].revenue || 0),
      totalProducts: parseInt(productsResult.rows[0].count || 0),
      lowStockCount: 0,
      recentSales: [],
      topProducts: [],
      salesTrend: []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.json({
      totalSales: 0,
      totalRevenue: 0,
      totalProducts: 0,
      lowStockCount: 0,
      recentSales: [],
      topProducts: [],
      salesTrend: []
    });
  }
});

// Products
app.get('/api/inventory/products/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_product WHERE business_id = $1::bigint ORDER BY name',
      [req.user.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Products error:', error);
    res.json([]);
  }
});

// Categories
app.get('/api/inventory/categories/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_category WHERE business_id = $1::bigint ORDER BY name',
      [req.user.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Categories error:', error);
    res.json([]);
  }
});

// Notifications
app.get('/api/notifications/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications_notification WHERE business_id = $1::bigint ORDER BY created_at DESC',
      [req.user.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Notifications error:', error);
    res.json([]);
  }
});

// Low stock
app.get('/api/inventory/products/low-stock/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory_product WHERE business_id = $1::bigint AND stock_quantity <= reorder_level ORDER BY stock_quantity',
      [req.user.business_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Low stock error:', error);
    res.json([]);
  }
});

// Catch all other routes
app.use('/api/*', (req, res) => {
  res.json([]);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SupaWave API running on port ${PORT}`);
});

module.exports = app;