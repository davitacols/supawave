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

// Store registered users
const registeredUsers = {};

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SupaWave API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints
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
      access: createJWTLikeToken({
        userId: newUserId,
        email: email,
        role: 'owner',
        businessId: newBusinessId
      }),
      refresh: 'refresh-token-' + newUserId,
      expiresIn: 86400
    }
  });
});

// Helper function to create JWT-like tokens
const createJWTLikeToken = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400
  }));
  const signature = btoa('fake-signature-' + Date.now());
  return `${header}.${payloadStr}.${signature}`;
};

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Check if user is registered
  const registeredUser = registeredUsers[email];
  if (registeredUser) {
    const accessToken = createJWTLikeToken({
      userId: registeredUser.id,
      email: registeredUser.email,
      role: registeredUser.role,
      businessId: registeredUser.business_id
    });
    
    return res.json({
      user: {
        id: registeredUser.id,
        email: registeredUser.email,
        first_name: registeredUser.first_name,
        last_name: registeredUser.last_name,
        role: registeredUser.role,
        business_id: registeredUser.business_id
      },
      tokens: {
        access: accessToken,
        refresh: 'refresh-' + accessToken,
        expiresIn: 86400
      }
    });
  }
  
  // Default user login
  if (email === 'pic2nav@gmail.com' && password === 'password123') {
    const accessToken = createJWTLikeToken({
      userId: '1104518454268002305',
      email: 'pic2nav@gmail.com',
      role: 'owner',
      businessId: '1104518460022685697'
    });
    
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
        access: accessToken,
        refresh: 'refresh-' + accessToken,
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

app.put('/api/auth/business', (req, res) => {
  res.json({ message: 'Business updated successfully' });
});

app.get('/api/auth/staff', (req, res) => {
  res.json([]);
});

app.post('/api/auth/staff', (req, res) => {
  res.status(201).json({ message: 'Staff created successfully' });
});

app.put('/api/auth/staff/:id', (req, res) => {
  res.json({ message: 'Staff updated successfully' });
});

app.delete('/api/auth/staff/:id', (req, res) => {
  res.json({ message: 'Staff deleted successfully' });
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

app.put('/api/inventory/products/:id/', (req, res) => {
  res.json({ message: 'Product updated successfully' });
});

app.delete('/api/inventory/products/:id/', (req, res) => {
  res.json({ message: 'Product deleted successfully' });
});

app.get('/api/inventory/products/low-stock/', (req, res) => {
  res.json([]);
});

app.get('/api/inventory/categories/', (req, res) => {
  res.json([]);
});

app.post('/api/inventory/categories/', (req, res) => {
  res.status(201).json({ message: 'Category created successfully' });
});

app.get('/api/inventory/suppliers/', (req, res) => {
  res.json([]);
});

app.post('/api/inventory/suppliers/', (req, res) => {
  res.status(201).json({ message: 'Supplier created successfully' });
});

app.get('/api/inventory/barcode-search/', (req, res) => {
  res.json({ product: null });
});

app.post('/api/inventory/products/:id/generate-barcode/', (req, res) => {
  res.json({ barcode: '123456789' });
});

app.get('/api/inventory/smart-reorder/', (req, res) => {
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

app.get('/api/sales/receipt/:id/', (req, res) => {
  res.json({ receipt: 'Receipt data' });
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

app.get('/api/analytics/quick-stats/', (req, res) => {
  res.json({ stats: {} });
});

app.post('/api/analytics/alerts/:id/read/', (req, res) => {
  res.json({ message: 'Alert marked as read' });
});

// Notifications
app.get('/api/notifications/', (req, res) => {
  res.json([]);
});

app.patch('/api/notifications/:id/', (req, res) => {
  res.json({ message: 'Notification updated' });
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

app.get('/api/invoices/:id/', (req, res) => {
  res.json({ invoice: 'Invoice data' });
});

app.put('/api/invoices/:id/', (req, res) => {
  res.json({ message: 'Invoice updated successfully' });
});

app.get('/api/invoices/customers/', (req, res) => {
  res.json([]);
});

app.post('/api/invoices/customers/', (req, res) => {
  res.status(201).json({ message: 'Customer created successfully' });
});

app.put('/api/invoices/customers/:id/', (req, res) => {
  res.json({ message: 'Customer updated successfully' });
});

app.delete('/api/invoices/customers/:id/', (req, res) => {
  res.json({ message: 'Customer deleted successfully' });
});

// WhatsApp endpoints
app.get('/api/whatsapp/config/', (req, res) => {
  res.json({ config: {} });
});

app.put('/api/whatsapp/config/', (req, res) => {
  res.json({ message: 'WhatsApp config updated' });
});

app.get('/api/whatsapp/templates/', (req, res) => {
  res.json([]);
});

app.post('/api/whatsapp/templates/', (req, res) => {
  res.status(201).json({ message: 'Template created successfully' });
});

app.get('/api/whatsapp/messages/', (req, res) => {
  res.json([]);
});

app.post('/api/whatsapp/send-promotion/', (req, res) => {
  res.json({ message: 'Promotion sent successfully' });
});

// Sync endpoints
app.get('/api/sync/data/', (req, res) => {
  res.json({ data: [] });
});

app.post('/api/sync/upload/', (req, res) => {
  res.json({ message: 'Data uploaded successfully' });
});

app.get('/api/sync/status/', (req, res) => {
  res.json({ status: 'connected' });
});

// Payment endpoints
app.get('/api/payments/plans/', (req, res) => {
  res.json([]);
});

app.get('/api/payments/status/', (req, res) => {
  res.json({ status: 'active' });
});

app.post('/api/payments/initiate/', (req, res) => {
  res.json({ payment_url: 'https://paystack.com/pay/test' });
});

app.post('/api/payments/verify/', (req, res) => {
  res.json({ status: 'success' });
});

app.post('/api/payments/cancel/', (req, res) => {
  res.json({ message: 'Subscription cancelled' });
});

// Store endpoints
app.get('/api/stores/', (req, res) => {
  res.json([]);
});

app.post('/api/stores/', (req, res) => {
  res.status(201).json({ message: 'Store created successfully' });
});

app.put('/api/stores/:id/', (req, res) => {
  res.json({ message: 'Store updated successfully' });
});

app.delete('/api/stores/:id/', (req, res) => {
  res.json({ message: 'Store deleted successfully' });
});

app.post('/api/stores/:id/set_main/', (req, res) => {
  res.json({ message: 'Main store set successfully' });
});

app.get('/api/stores/:id/inventory/', (req, res) => {
  res.json([]);
});

app.post('/api/stores/:id/add-product/', (req, res) => {
  res.json({ message: 'Product added to store' });
});

// Transfer endpoints
app.get('/api/transfers/', (req, res) => {
  res.json([]);
});

app.post('/api/transfers/', (req, res) => {
  res.status(201).json({ message: 'Transfer created successfully' });
});

app.post('/api/transfers/:id/approve/', (req, res) => {
  res.json({ message: 'Transfer approved' });
});

app.post('/api/transfers/:id/complete/', (req, res) => {
  res.json({ message: 'Transfer completed' });
});

app.post('/api/transfers/:id/cancel/', (req, res) => {
  res.json({ message: 'Transfer cancelled' });
});

// Marketplace endpoints
app.get('/api/marketplace/listings/', (req, res) => {
  res.json([]);
});

app.post('/api/marketplace/listings/', (req, res) => {
  res.status(201).json({ message: 'Listing created successfully' });
});

app.get('/api/marketplace/listings/my_listings/', (req, res) => {
  res.json([]);
});

app.post('/api/marketplace/listings/:id/make_offer/', (req, res) => {
  res.json({ message: 'Offer made successfully' });
});

app.get('/api/marketplace/offers/', (req, res) => {
  res.json([]);
});

app.post('/api/marketplace/offers/:id/accept/', (req, res) => {
  res.json({ message: 'Offer accepted' });
});

app.post('/api/marketplace/offers/:id/reject/', (req, res) => {
  res.json({ message: 'Offer rejected' });
});

app.get('/api/marketplace/group-buys/', (req, res) => {
  res.json([]);
});

app.post('/api/marketplace/group-buys/', (req, res) => {
  res.status(201).json({ message: 'Group buy created successfully' });
});

app.post('/api/marketplace/group-buys/:id/join/', (req, res) => {
  res.json({ message: 'Joined group buy successfully' });
});

app.get('/api/marketplace/suppliers/', (req, res) => {
  res.json([]);
});

app.post('/api/marketplace/suppliers/', (req, res) => {
  res.status(201).json({ message: 'Supplier created successfully' });
});

app.post('/api/marketplace/suppliers/:id/add_review/', (req, res) => {
  res.json({ message: 'Review added successfully' });
});

// Reports endpoints
app.get('/api/reports/daily/', (req, res) => {
  res.json({ data: [] });
});

app.get('/api/reports/monthly/', (req, res) => {
  res.json({ data: [] });
});

app.get('/api/reports/yearly/', (req, res) => {
  res.json({ data: [] });
});

app.get('/api/reports/export/daily/', (req, res) => {
  res.json({ export_url: 'https://example.com/export.csv' });
});

app.get('/api/reports/export/monthly/', (req, res) => {
  res.json({ export_url: 'https://example.com/export.csv' });
});

app.get('/api/reports/export/yearly/', (req, res) => {
  res.json({ export_url: 'https://example.com/export.csv' });
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

app.get('/api/credit/dashboard/', (req, res) => {
  res.json({
    total_outstanding: 250000,
    overdue_amount: 75000,
    weekly_collections: 45000,
    total_credit_customers: 12
  });
});

app.get('/api/credit/customers/', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'John Doe',
      phone: '+2348123456789',
      credit_limit: 100000,
      current_balance: 25000,
      available_credit: 75000,
      is_overdue: false
    },
    {
      id: 2,
      name: 'Jane Smith',
      phone: '+2348987654321',
      credit_limit: 50000,
      current_balance: 60000,
      available_credit: -10000,
      is_overdue: true
    }
  ]);
});

app.post('/api/credit/customers/', (req, res) => {
  res.status(201).json({ message: 'Credit customer created successfully' });
});

app.get('/api/credit/sales/', (req, res) => {
  res.json([
    {
      id: 1,
      customer_name: 'John Doe',
      customer_phone: '+2348123456789',
      total_amount: 15000,
      amount_paid: 5000,
      balance_due: 10000,
      due_date: '2025-01-25',
      is_paid: false
    },
    {
      id: 2,
      customer_name: 'Jane Smith',
      customer_phone: '+2348987654321',
      total_amount: 25000,
      amount_paid: 25000,
      balance_due: 0,
      due_date: '2025-01-20',
      is_paid: true
    }
  ]);
});

// Export for Vercel
module.exports = app;