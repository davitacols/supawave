const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { requestLogger, errorLogger } = require('./middleware/logger');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Additional CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use(requestLogger);
// app.use(apiLimiter); // Temporarily disabled for testing

// Routes (temporarily disable auth rate limiting for testing)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/stores', require('./routes/stores'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave Node.js API is running',
    version: '1.0.0'
  });
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

// Test staff endpoint
app.get('/api/test-staff-simple', (req, res) => {
  console.log('🧪 Test staff endpoint called');
  res.json([
    { id: 1, name: 'Test Staff 1', role: 'manager' },
    { id: 2, name: 'Test Staff 2', role: 'cashier' }
  ]);
});

// Error handling
app.use(errorLogger);
app.use((err, req, res, next) => {
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

app.listen(PORT, () => {
  console.log(`🚀 SupaWave API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api`);
  console.log(`🌐 Server accessible on both localhost and network IP`);
});