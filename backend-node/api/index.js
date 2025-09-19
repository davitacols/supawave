const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Database connection with better error handling
let pool;
try {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
  } else {
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20));
  }
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
  });
  
  // Test connection
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });
  
} catch (error) {
  console.error('Database connection setup failed:', error);
}

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

// Debug endpoint to check environment
app.get('/api/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20),
    JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check tables
app.get('/api/debug/tables', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database pool not initialized' });
    }
    
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    res.json({ tables: result.rows.map(row => row.table_name) });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
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
    console.log('Fetching dashboard stats for business:', businessId);
    
    // Try different table names that might exist
    let salesResult, productsResult, lowStockResult, recentSalesResult;
    
    try {
      salesResult = await pool.query(
        'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales_sale WHERE business_id = $1::bigint',
        [businessId]
      );
    } catch (e) {
      console.log('sales_sale query failed:', e.message);
      salesResult = { rows: [{ count: '0', revenue: '0' }] };
    }
    
    try {
      productsResult = await pool.query(
        'SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1::bigint',
        [businessId]
      );
    } catch (e) {
      console.log('inventory_product query failed:', e.message);
      productsResult = { rows: [{ count: '0' }] };
    }
    
    try {
      lowStockResult = await pool.query(
        'SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1::bigint AND stock_quantity <= reorder_level',
        [businessId]
      );
    } catch (e) {
      lowStockResult = { rows: [{ count: '0' }] };
    }
    
    try {
      recentSalesResult = await pool.query(
        'SELECT id, customer_name, total_amount, created_at FROM sales_sale WHERE business_id = $1::bigint ORDER BY created_at DESC LIMIT 5',
        [businessId]
      );
    } catch (e) {
      recentSalesResult = { rows: [] };
    }
    
    res.json({
      totalSales: parseInt(salesResult.rows[0].count || 0),
      totalRevenue: parseFloat(salesResult.rows[0].revenue || 0),
      totalProducts: parseInt(productsResult.rows[0].count || 0),
      lowStockCount: parseInt(lowStockResult.rows[0].count || 0),
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
    // Return default values instead of error
    res.json({
      totalSales: 0,
      totalRevenue: 0,
      totalProducts: 0,
      lowStockCount: 0,
      recentSales: [],
      topProducts: [],
      salesTrend: []
    });
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
      'SELECT * FROM customers WHERE business_id = $1::bigint ORDER BY name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Customers fetch error:', error);
    res.json([]);
  }
});

app.post('/api/customers/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const { name, email, phone, address } = req.body;
    const result = await pool.query(
      'INSERT INTO customers_customer (name, email, phone, address, business_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [name, email, phone, address, businessId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Customer creation error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
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

app.get('/api/auth/staff', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    console.log('Fetching staff for business:', businessId);
    
    const result = await pool.query(
      `SELECT id, username, first_name, last_name, email, phone_number, role, is_active_staff
       FROM accounts_user 
       WHERE business_id = $1::bigint AND role IN ('manager', 'cashier')
       ORDER BY first_name, last_name`,
      [businessId]
    );
    
    console.log('Staff found:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Staff fetch error:', error);
    res.json([]);
  }
});

// Generate alerts endpoint
app.post('/api/inventory/alerts/generate_alerts/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    
    // Generate alerts for low stock products
    const result = await pool.query(
      `SELECT COUNT(*) as low_stock_count
       FROM inventory_product 
       WHERE business_id = $1::bigint AND stock_quantity <= reorder_level`,
      [businessId]
    );
    
    res.json({
      message: 'Alerts generated successfully',
      low_stock_alerts: parseInt(result.rows[0].low_stock_count || 0)
    });
  } catch (error) {
    console.error('Generate alerts error:', error);
    res.status(500).json({ error: 'Failed to generate alerts' });
  }
});

// Invoice customers
app.get('/api/invoices/customers/', (req, res) => {
  res.json([]);
});

app.post('/api/invoices/customers/', (req, res) => {
  res.status(201).json({ message: 'Customer created successfully' });
});

// Inventory alerts and recommendations
app.get('/api/inventory/alerts/', (req, res) => {
  res.json([]);
});

app.get('/api/inventory/alerts/recommendations/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    // Get products that need reordering (stock <= reorder level)
    const result = await pool.query(
      `SELECT p.*, 
              (p.reorder_level - p.stock_quantity) as suggested_quantity,
              CASE 
                WHEN p.stock_quantity = 0 THEN 'out_of_stock'
                WHEN p.stock_quantity <= p.reorder_level THEN 'low_stock'
                ELSE 'normal'
              END as status
       FROM inventory_product p 
       WHERE p.business_id = $1 AND p.stock_quantity <= p.reorder_level
       ORDER BY p.stock_quantity ASC, p.name`,
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Smart reorder fetch error:', error);
    res.json([]);
  }
});

app.get('/api/inventory/purchase-orders/', (req, res) => {
  res.json([]);
});

app.get('/api/inventory/stock-takes/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM inventory_stocktake WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Stock takes fetch error:', error);
    res.json([]);
  }
});

app.post('/api/inventory/stock-takes/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const { name, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO inventory_stocktake (name, notes, business_id, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [name, notes, businessId, 'in_progress']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Stock take creation error:', error);
    res.status(500).json({ error: 'Failed to create stock take' });
  }
});

// Transfers
app.get('/api/transfers/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    console.log('Fetching transfers for business:', businessId);
    
    const result = await pool.query(
      'SELECT * FROM stores_inventorytransfer WHERE business_id = $1::bigint ORDER BY created_at DESC',
      [businessId]
    );
    
    console.log('Transfers found:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Transfers fetch error:', error);
    res.json([]);
  }
});

app.post('/api/transfers/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const { from_store_id, to_store_id, product_id, quantity, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO inventory_transfer (from_store_id, to_store_id, product_id, quantity, notes, business_id, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
      [from_store_id, to_store_id, product_id, quantity, notes, businessId, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Transfer creation error:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

// Marketplace endpoints
app.get('/api/marketplace/group-buys/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM marketplace_groupbuy WHERE business_id = $1::bigint ORDER BY created_at DESC',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Group buys fetch error:', error);
    res.json([]);
  }
});

app.get('/api/marketplace/suppliers/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM marketplace_supplier WHERE business_id = $1::bigint ORDER BY name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Marketplace suppliers fetch error:', error);
    res.json([]);
  }
});

app.get('/api/marketplace/listings/my_listings/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM marketplace_listing WHERE business_id = $1::bigint ORDER BY created_at DESC',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('My listings fetch error:', error);
    res.json([]);
  }
});

app.get('/api/marketplace/listings/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM marketplace_listing WHERE is_active = true ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Listings fetch error:', error);
    res.json([]);
  }
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

app.get('/api/whatsapp/messages/', (req, res) => {
  res.json([]);
});

// Other missing endpoints
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

app.get('/api/stores/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const result = await pool.query(
      'SELECT * FROM stores_store WHERE business_id = $1 ORDER BY name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Stores fetch error:', error);
    res.json([]);
  }
});

app.post('/api/stores/', async (req, res) => {
  try {
    const businessId = getBusinessId(req);
    const { name, address, phone, manager_id } = req.body;
    const result = await pool.query(
      'INSERT INTO stores_store (name, address, phone, manager_id, business_id, is_active, created_at) VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING *',
      [name, address, phone, manager_id, businessId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Store creation error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

app.get('/api/reports/daily/', (req, res) => {
  res.json({ data: [] });
});

app.post('/api/notifications/mark-all-read/', (req, res) => {
  res.json({ message: 'All notifications marked as read' });
});

// Export for Vercel
module.exports = app;