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

// Routes with individual error handling
const routes = [
  ['/api/auth', '../routes/auth'],
  ['/api/dashboard', '../routes/dashboard'],
  ['/api/inventory', '../routes/inventory'],
  ['/api/sales', '../routes/sales'],
  ['/api/customers', '../routes/customers'],
  ['/api/stores', '../routes/stores'],
  ['/api/transfers', '../routes/transfers'],
  ['/api/forecasting', '../routes/forecasting'],
  ['/api/notifications', '../routes/notifications', 'router']
];

routes.forEach(([path, routePath, exportName]) => {
  try {
    const route = require(routePath);
    app.use(path, exportName ? route[exportName] : route);
    console.log(`✅ Loaded route: ${path}`);
  } catch (error) {
    console.error(`❌ Failed to load route ${path}:`, error.message);
    // Create fallback route
    app.use(path, (req, res) => {
      res.status(503).json({ error: `Route ${path} temporarily unavailable` });
    });
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