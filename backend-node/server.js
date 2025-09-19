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

// Enhanced CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'https://supawave.vercel.app',
    'https://supawave-frontend.vercel.app'
  ];
  
  // Allow all origins in development or if origin is in allowed list
  if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use(requestLogger);
// app.use(apiLimiter); // Temporarily disabled for testing

// Routes (temporarily disable auth rate limiting for testing)
app.use('/api/auth', require('./routes/auth'));

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
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/credit', require('./routes/credit'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai'));

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
app.use(errorLogger);
app.use((err, req, res, next) => {
  // Ensure CORS headers are set even for errors
  const origin = req.headers.origin;
  if (!res.headersSent) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
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