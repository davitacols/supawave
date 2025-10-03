const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

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

// Simple logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes with error handling
try {
  app.use('/api/auth', require('./routes/auth'));
} catch (error) {
  console.log('Auth routes not loaded:', error.message);
}

// Simple debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Backend is working',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      CLAUDE_API_KEY_EXISTS: !!process.env.CLAUDE_API_KEY
    },
    cors: {
      origin: req.headers.origin,
      method: req.method,
      headers: req.headers
    }
  });
});
// Load routes with error handling and fallbacks
const routes = [
  { path: '/api/inventory', file: './routes/inventory' },
  { path: '/api/sales', file: './routes/sales' },
  { path: '/api/customers', file: './routes/customers' },
  { path: '/api/credit', file: './routes/credit' },
  { path: '/api/analytics', file: './routes/analytics' },
  { path: '/api/reports', file: './routes/reports' },
  { path: '/api/staff', file: './routes/staff' },
  { path: '/api/stores', file: './routes/stores' },
  { path: '/api/invoices', file: './routes/invoices' },
  { path: '/api/transfers', file: './routes/transfers' },
  { path: '/api/marketplace', file: './routes/marketplace' },
  { path: '/api/dashboard', file: './routes/dashboard' },
  { path: '/api/ai', file: './routes/ai' },
  { path: '/api/forecasting', file: './routes/forecasting' },
  { path: '/api/finance', file: './routes/finance' }
];

routes.forEach(route => {
  try {
    app.use(route.path, require(route.file));
    console.log(`✅ Loaded ${route.path}`);
  } catch (error) {
    console.log(`❌ Failed to load ${route.path}:`, error.message);
    // Add fallback endpoints for critical routes
    if (route.path === '/api/dashboard') {
      app.get('/api/dashboard/stats', (req, res) => {
        res.json({
          todayStats: { sales: 0, revenue: 0, customers: 0, orders: 0 },
          weeklyStats: { sales: 0, revenue: 0, customers: 0, orders: 0 },
          monthlyStats: { sales: 0, revenue: 0, customers: 0, orders: 0 },
          inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, categories: 0 }
        });
      });
    }
    if (route.path === '/api/forecasting') {
      app.get('/api/forecasting/dashboard', (req, res) => {
        res.json({ critical_stockouts: 0, recommendations: [] });
      });
    }
    if (route.path === '/api/inventory') {
      app.get('/api/inventory/products/low-stock', (req, res) => {
        res.json([]);
      });
    }
  }
});

// Load notifications separately
try {
  app.use('/api/notifications', require('./routes/notifications').router);
  console.log('✅ Loaded /api/notifications');
} catch (error) {
  console.log('❌ Failed to load /api/notifications:', error.message);
  app.get('/api/notifications', (req, res) => {
    res.json({ notifications: [], unread_count: 0 });
  });
}

// Test forecasting endpoint
app.get('/api/test-forecasting', (req, res) => {
  res.json({ 
    message: 'Forecasting routes loaded successfully',
    timestamp: new Date().toISOString(),
    available_routes: [
      '/api/forecasting/dashboard',
      '/api/forecasting/recommendations',
      '/api/forecasting/products/:id/forecast',
      '/api/forecasting/products/:id/trends'
    ]
  });
});

// Debug endpoint to check business data
app.get('/api/debug-business', require('./middleware/auth').authenticateToken, async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const products = await pool.query(`
      SELECT id, name, stock_quantity, low_stock_threshold, reorder_point
      FROM inventory_product 
      WHERE business_id = $1 AND is_active = true
      ORDER BY stock_quantity ASC
      LIMIT 10
    `, [req.user.business_id]);
    
    const lowStockProducts = products.rows.filter(p => 
      parseInt(p.stock_quantity) <= parseInt(p.reorder_point)
    );
    
    res.json({
      business_id: req.user.business_id,
      total_products: products.rows.length,
      low_stock_products: lowStockProducts.length,
      products: products.rows.map(p => ({
        name: p.name,
        stock: parseInt(p.stock_quantity),
        threshold: parseInt(p.low_stock_threshold),
        reorder_point: parseInt(p.reorder_point),
        needs_reorder: parseInt(p.stock_quantity) <= parseInt(p.reorder_point)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave Node.js API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working', cors: 'OK' });
});

app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave API endpoints',
    endpoints: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/inventory/products',
      '/api/sales',
      '/api/customers',
      '/api/analytics',
      '/api/notifications',
      '/api/marketplace'
    ]
  });
});

// Test login endpoint
app.post('/api/test-login', (req, res) => {
  console.log('🧪 Test login received:', req.body);
  res.json({ message: 'Test login endpoint working', body: req.body });
});

// Simple CORS test endpoint
app.post('/api/cors-test', (req, res) => {
  console.log('🌐 CORS test endpoint hit');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.method);
  res.json({ 
    success: true, 
    message: 'CORS is working',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Quick login endpoint for testing
app.post('/api/quick-login', (req, res) => {
  const { generateTokenPair } = require('./utils/tokenGenerator');
  
  const testUser = {
    id: 1,
    email: 'test@supawave.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    role: 'owner',
    business_id: 1
  };
  
  const tokens = generateTokenPair(testUser);
  
  res.json({
    user: testUser,
    tokens
  });
});

// Test staff endpoint
app.get('/api/test-staff-simple', (req, res) => {
  console.log('🧪 Test staff endpoint called');
  res.json([
    { id: 1, name: 'Test Staff 1', role: 'manager' },
    { id: 2, name: 'Test Staff 2', role: 'cashier' }
  ]);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SupaWave API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api`);
  console.log(`🌐 Server accessible on both localhost and network IP`);
  
  // Log environment info for deployment
  console.log(`🔑 JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
  console.log(`🔑 Using JWT_SECRET: ${process.env.JWT_SECRET?.substring(0, 10)}...`);
  console.log(`🤖 Claude API Key configured: ${!!process.env.CLAUDE_API_KEY}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});