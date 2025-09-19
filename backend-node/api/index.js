const express = require('express');
const cors = require('cors');

const app = express();

// Simple CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints
// Store registered users
const registeredUsers = {};

app.post('/api/auth/register', (req, res) => {
  const { business_name, username, email, password, first_name, last_name, phone_number } = req.body;
  
  const newUserId = Date.now().toString();
  const newBusinessId = (Date.now() + 1000).toString();
  
  // Store user data
  registeredUsers[email] = {
    id: newUserId,
    username: username || 'newuser',
    email: email,
    first_name: first_name || 'New',
    last_name: last_name || 'User',
    phone_number: phone_number || '',
    business_name: business_name || 'New Business',
    role: 'owner',
    business_id: newBusinessId,
    registration_date: new Date().toISOString(),
    subscription_status: 'trial',
    trial_days_left: '14'
  };
  
  res.status(201).json({
    user: {
      id: newUserId,
      username: username || 'newuser',
      email: email,
      first_name: first_name || 'New',
      last_name: last_name || 'User',
      role: 'owner',
      business_id: newBusinessId
    },
    tokens: {
      access: 'test-token-' + newUserId,
      refresh: 'test-refresh-token-' + newUserId,
      expiresIn: 86400
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'pic2nav@gmail.com' && password === 'password123') {
    res.json({
      user: {
        id: '1104518454268002305',
        email: 'pic2nav@gmail.com',
        first_name: 'Camp',
        last_name: 'Davids',
        role: 'owner',
        business_id: '1104518460022685697'
      },
      tokens: {
        access: 'test-token',
        refresh: 'test-refresh-token',
        expiresIn: 86400
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/business', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // Check if it's a registered user token
  if (token && token.startsWith('test-token-')) {
    const userId = token.replace('test-token-', '');
    const user = Object.values(registeredUsers).find(u => u.id === userId);
    
    if (user) {
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        business_name: user.business_name,
        registration_date: user.registration_date,
        subscription_status: user.subscription_status,
        trial_days_left: user.trial_days_left
      });
    }
  }
  
  // Default to existing user
  res.json({
    id: '1104518454268002305',
    username: 'campdavids',
    email: 'pic2nav@gmail.com',
    first_name: 'Camp',
    last_name: 'Davids',
    phone_number: '+2348108209953',
    business_name: 'Pic2Nav',
    registration_date: '2025-09-06T07:11:24.426Z',
    subscription_status: 'trial',
    trial_days_left: '0'
  });
});

app.get('/api/auth/staff', (req, res) => {
  res.json([]);
});

app.post('/api/auth/staff', (req, res) => {
  res.status(201).json({ message: 'Staff created successfully' });
});

// Dashboard endpoints
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalSales: 31,
    totalRevenue: 8718089.00,
    totalProducts: 150,
    lowStockCount: 5,
    recentSales: [],
    topProducts: [],
    salesTrend: []
  });
});

// Inventory endpoints
app.get('/api/inventory/products/', (req, res) => {
  res.json([]);
});

app.post('/api/inventory/products/', (req, res) => {
  res.status(201).json({ message: 'Product created successfully' });
});

app.get('/api/inventory/products/low-stock/', (req, res) => {
  res.json([]);
});

app.get('/api/inventory/categories/', (req, res) => {
  res.json([]);
});

app.get('/api/inventory/suppliers/', (req, res) => {
  res.json([]);
});

// Sales endpoints
app.get('/api/sales/', (req, res) => {
  res.json([]);
});

app.post('/api/sales/', (req, res) => {
  res.status(201).json({ message: 'Sale created successfully' });
});

app.get('/api/sales/analytics/', (req, res) => {
  res.json({ totalSales: 0, totalRevenue: 0 });
});

// Customer endpoints
app.get('/api/customers/', (req, res) => {
  res.json([]);
});

app.post('/api/customers/', (req, res) => {
  res.status(201).json({ message: 'Customer created successfully' });
});

// Analytics endpoints
app.get('/api/analytics/advanced/', (req, res) => {
  res.json({ data: [] });
});

app.get('/api/analytics/live-metrics/', (req, res) => {
  res.json({ metrics: {} });
});

// Notifications
app.get('/api/notifications/', (req, res) => {
  res.json([]);
});

app.post('/api/notifications/mark-all-read/', (req, res) => {
  res.json({ message: 'All notifications marked as read' });
});

// Invoice endpoints
app.get('/api/invoices/', (req, res) => {
  res.json([]);
});

app.post('/api/invoices/', (req, res) => {
  res.status(201).json({ message: 'Invoice created successfully' });
});

// Store endpoints
app.get('/api/stores/', (req, res) => {
  res.json([]);
});

app.post('/api/stores/', (req, res) => {
  res.status(201).json({ message: 'Store created successfully' });
});

// Transfer endpoints
app.get('/api/transfers/', (req, res) => {
  res.json([]);
});

app.post('/api/transfers/', (req, res) => {
  res.status(201).json({ message: 'Transfer created successfully' });
});

// Marketplace endpoints
app.get('/api/marketplace/listings/', (req, res) => {
  res.json([]);
});

app.post('/api/marketplace/listings/', (req, res) => {
  res.status(201).json({ message: 'Listing created successfully' });
});

// Reports endpoints
app.get('/api/reports/daily/', (req, res) => {
  res.json({ data: [] });
});

app.get('/api/reports/monthly/', (req, res) => {
  res.json({ data: [] });
});

// AI endpoints
app.post('/api/ai/chat/', (req, res) => {
  res.json({ response: 'AI response placeholder' });
});

// Credit endpoints
app.get('/api/credit/', (req, res) => {
  res.json([]);
});

app.post('/api/credit/', (req, res) => {
  res.status(201).json({ message: 'Credit record created successfully' });
});

// Export for Vercel
module.exports = app;