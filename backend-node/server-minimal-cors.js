const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Enhanced CORS middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false,
  optionsSuccessStatus: 200
}));

// Additional OPTIONS handler
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.sendStatus(200);
});

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave API with CORS fix',
    timestamp: new Date().toISOString()
  });
});

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  res.json({ 
    success: true, 
    message: 'CORS is working',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Mock endpoints for testing
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    todayStats: { sales: 0, revenue: 0, customers: 0, orders: 0 },
    weeklyStats: { sales: 0, revenue: 0, customers: 0, orders: 0 },
    monthlyStats: { sales: 0, revenue: 0, customers: 0, orders: 0 },
    inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, categories: 0 }
  });
});

app.get('/api/auth/business', (req, res) => {
  res.json({ id: 1, name: 'Test Business', status: 'active' });
});

app.get('/api/notifications', (req, res) => {
  res.json({ notifications: [], unread_count: 0 });
});

app.get('/api/stores', (req, res) => {
  res.json([]);
});

app.get('/api/forecasting/dashboard', (req, res) => {
  res.json({ critical_stockouts: 0, recommendations: [] });
});

app.get('/api/inventory/products/low-stock', (req, res) => {
  res.json([]);
});

module.exports = app;