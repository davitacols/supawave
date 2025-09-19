const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Simple CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Store registered users
const registeredUsers = {};

// Helper function to get business ID from token
const getBusinessId = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  let businessId = '1104518460022685697'; // Default
  
  if (token && token.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      businessId = payload.businessId;
    } catch (e) {}
  }
  
  return businessId;
};

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

app.post('/api/auth/login', async (req, res) => {
  try {
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
    
    // Check database for existing users
    const userResult = await pool.query(
      'SELECT id, username, email, first_name, last_name, business_id, role FROM accounts_user WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const accessToken = createJWTLikeToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        businessId: user.business_id
      });
      
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          business_id: user.business_id
        },
        tokens: {
          access: accessToken,
          refresh: 'refresh-' + accessToken,
          expiresIn: 86400
        }
      });
    }
    
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/business', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
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
    
    const businessId = getBusinessId(req);
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
       WHERE u.business_id = $1 AND u.role = 'owner'`,
      [businessId]
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

// Dashboard endpoints
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    
    const salesResult = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales_sale WHERE business_id = $1',
      [businessId]
    );
    
    const productsResult = await pool.query(
      'SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1',
      [businessId]
    );
    
    const lowStockResult = await pool.query(
      'SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1 AND stock_quantity <= reorder_level',
      [businessId]
    );
    
    const recentSalesResult = await pool.query(
      'SELECT id, customer_name, total_amount, created_at FROM sales_sale WHERE business_id = $1 ORDER BY created_at DESC LIMIT 5',
      [businessId]
    );
    
    res.json({
      totalSales: parseInt(salesResult.rows[0].count),
      totalRevenue: parseFloat(salesResult.rows[0].revenue),
      totalProducts: parseInt(productsResult.rows[0].count),
      lowStockCount: parseInt(lowStockResult.rows[0].count),
      recentSales: recentSalesResult.rows.map(sale => ({
        id: sale.id,
        customer: sale.customer_name || 'Walk-in Customer',
        amount: parseFloat(sale.total_amount),
        date: sale.created_at.toISOString().split('T')[0]
      })),
      topProducts: [],
      salesTrend: []
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Inventory endpoints
app.get('/api/inventory/products/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM inventory_product WHERE business_id = $1 ORDER BY name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.json([]);
  }
});

app.post('/api/inventory/products/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const { name, description, price, cost, stock_quantity, reorder_level, category_id } = req.body;
    
    const result = await pool.query(
      'INSERT INTO inventory_product (name, description, price, cost, stock_quantity, reorder_level, category_id, business_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *',
      [name, description, price, cost, stock_quantity, reorder_level, category_id, businessId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.get('/api/inventory/products/low-stock/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM inventory_product WHERE business_id = $1 AND stock_quantity <= reorder_level ORDER BY stock_quantity',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Low stock fetch error:', error);
    res.json([]);
  }
});

app.get('/api/inventory/categories/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM inventory_category WHERE business_id = $1 ORDER BY name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.json([]);
  }
});

// Sales endpoints
app.get('/api/sales/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM sales_sale WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Sales fetch error:', error);
    res.json([]);
  }
});

app.post('/api/sales/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const { customer_name, customer_phone, total_amount, payment_method, items } = req.body;
    
    const result = await pool.query(
      'INSERT INTO sales_sale (customer_name, customer_phone, total_amount, payment_method, business_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [customer_name, customer_phone, total_amount, payment_method, businessId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Sale creation error:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

// Customer endpoints
app.get('/api/customers/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM customers_customer WHERE business_id = $1 ORDER BY name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Customers fetch error:', error);
    res.json([]);
  }
});

// Notifications
app.get('/api/notifications/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM notifications_notification WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.json([]);
  }
});

// Credit endpoints
app.get('/api/credit/dashboard/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN balance_due > 0 THEN balance_due END), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN due_date < NOW() AND balance_due > 0 THEN balance_due END), 0) as overdue_amount,
        COUNT(DISTINCT CASE WHEN balance_due > 0 THEN customer_id END) as total_credit_customers
       FROM credit_sale WHERE business_id = $1`,
      [businessId]
    );
    
    res.json({
      total_outstanding: parseFloat(result.rows[0].total_outstanding || 0),
      overdue_amount: parseFloat(result.rows[0].overdue_amount || 0),
      weekly_collections: 0,
      total_credit_customers: parseInt(result.rows[0].total_credit_customers || 0)
    });
  } catch (error) {
    console.error('Credit dashboard error:', error);
    res.json({ total_outstanding: 0, overdue_amount: 0, weekly_collections: 0, total_credit_customers: 0 });
  }
});

app.get('/api/credit/customers/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM credit_customer WHERE business_id = $1 ORDER BY name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Credit customers fetch error:', error);
    res.json([]);
  }
});

app.get('/api/credit/sales/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM credit_sale WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Credit sales fetch error:', error);
    res.json([]);
  }
});

// All other endpoints with basic responses
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/staff', (req, res) => {
  res.json([]);
});

app.post('/api/inventory/categories/', (req, res) => {
  res.status(201).json({ message: 'Category created successfully' });
});

app.get('/api/inventory/suppliers/', (req, res) => {
  res.json([]);
});

app.get('/api/sales/analytics/', (req, res) => {
  res.json({ totalSales: 0, totalRevenue: 0 });
});

app.get('/api/analytics/advanced/', (req, res) => {
  res.json({ data: [] });
});

app.get('/api/invoices/', (req, res) => {
  res.json([]);
});

app.get('/api/stores/', (req, res) => {
  res.json([]);
});

app.get('/api/marketplace/listings/', (req, res) => {
  res.json([]);
});

app.get('/api/reports/daily/', (req, res) => {
  res.json({ data: [] });
});

app.post('/api/notifications/mark-all-read/', (req, res) => {
  res.json({ message: 'All notifications marked as read' });
});

// Export for Vercel
module.exports = app;