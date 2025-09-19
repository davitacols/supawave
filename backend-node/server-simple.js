const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Simple CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
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
} catch (error) {
  console.error('Error loading routes:', error);
}

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave Node.js API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Ensure CORS headers are set even for errors
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
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
  console.log(`🔑 JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
  console.log(`🗄️ DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
});