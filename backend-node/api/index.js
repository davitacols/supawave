const express = require('express');
const cors = require('cors');

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

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave API endpoints',
    timestamp: new Date().toISOString()
  });
});

// Routes
try {
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/inventory', require('../routes/inventory'));
  app.use('/api/sales', require('../routes/sales'));
  app.use('/api/customers', require('../routes/customers'));
  app.use('/api/credit', require('../routes/credit'));
  app.use('/api/analytics', require('../routes/analytics'));
  app.use('/api/reports', require('../routes/reports'));
  app.use('/api/notifications', require('../routes/notifications').router);
  app.use('/api/staff', require('../routes/staff'));
  app.use('/api/stores', require('../routes/stores'));
  app.use('/api/invoices', require('../routes/invoices'));
  app.use('/api/transfers', require('../routes/transfers'));
  app.use('/api/marketplace', require('../routes/marketplace'));
  app.use('/api/dashboard', require('../routes/dashboard'));
  app.use('/api/ai', require('../routes/ai'));
  app.use('/api/forecasting', require('../routes/forecasting'));
  app.use('/api/finance', require('../routes/finance'));
} catch (error) {
  console.error('Route loading error:', error);
}

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