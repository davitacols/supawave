const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedSampleData() {
  console.log('🌱 Seeding sample data for ML forecasting...');
  
  try {
    // Get first business ID
    const businessResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (businessResult.rows.length === 0) {
      console.log('❌ No users found. Please register a user first.');
      return;
    }
    
    const businessId = businessResult.rows[0].id;
    console.log(`📊 Using business ID: ${businessId}`);
    
    // Create sample products if they don't exist
    const products = [
      { name: 'Coca-Cola 50cl', price: 200, cost: 150, stock: 25 },
      { name: 'Indomie Noodles', price: 100, cost: 80, stock: 80 },
      { name: 'Peak Milk', price: 300, cost: 250, stock: 15 },
      { name: 'Bread Loaf', price: 400, cost: 320, stock: 30 }
    ];
    
    const productIds = [];
    
    for (const product of products) {
      const productId = uuidv4();
      
      try {
        await pool.query(`
          INSERT INTO inventory_product (
            id, name, selling_price, cost_price, stock_quantity, 
            low_stock_threshold, reorder_point, business_id, is_active, 
            created_at, updated_at, sku, barcode
          ) VALUES ($1, $2, $3, $4, $5, 10, 20, $6, true, NOW(), NOW(), $7, $8)
          ON CONFLICT (barcode) DO NOTHING
        `, [
          productId, product.name, product.price, product.cost, product.stock,
          businessId, `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          Math.floor(Math.random() * 10000000000000).toString()
        ]);
        
        productIds.push({ id: productId, name: product.name });
        console.log(`✅ Created product: ${product.name}`);
      } catch (error) {
        if (error.code !== '23505') { // Ignore duplicate key errors
          console.error(`❌ Error creating product ${product.name}:`, error.message);
        }
      }
    }
    
    // Get existing products if creation failed
    if (productIds.length === 0) {
      const existingProducts = await pool.query(
        'SELECT id, name FROM inventory_product WHERE business_id = $1 LIMIT 4',
        [businessId]
      );
      productIds.push(...existingProducts.rows);
    }
    
    if (productIds.length === 0) {
      console.log('❌ No products available. Please create products first.');
      return;
    }
    
    console.log(`📦 Using ${productIds.length} products for sales data`);
    
    // Generate 60 days of sample sales data
    const salesData = [];
    const today = new Date();
    
    for (let i = 60; i >= 0; i--) {
      const saleDate = new Date(today);
      saleDate.setDate(today.getDate() - i);
      
      // Generate 1-5 sales per day
      const salesPerDay = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < salesPerDay; j++) {
        const saleId = Math.floor(Math.random() * 1000000);
        const randomProduct = productIds[Math.floor(Math.random() * productIds.length)];
        
        // Simulate seasonal patterns
        let baseQuantity = Math.floor(Math.random() * 10) + 1;
        
        // Weekend boost
        if (saleDate.getDay() === 0 || saleDate.getDay() === 6) {
          baseQuantity = Math.floor(baseQuantity * 1.4);
        }
        
        // Month-end boost
        if (saleDate.getDate() > 25) {
          baseQuantity = Math.floor(baseQuantity * 1.6);
        }
        
        const quantity = Math.max(1, baseQuantity);
        const unitPrice = 200; // Sample price
        const totalAmount = quantity * unitPrice;
        
        salesData.push({
          id: saleId,
          business_id: businessId,
          total_amount: totalAmount,
          created_at: saleDate,
          product_id: randomProduct.id,
          quantity: quantity,
          unit_price: unitPrice
        });
      }
    }
    
    console.log(`📈 Generated ${salesData.length} sample sales records`);
    
    // Insert sales data
    for (const sale of salesData) {
      try {
        // Insert sale
        await pool.query(`
          INSERT INTO sales_sale (id, business_id, total_amount, created_at, customer_phone)
          VALUES ($1, $2, $3, $4, '+234800000000')
          ON CONFLICT (id) DO NOTHING
        `, [sale.id, sale.business_id, sale.total_amount, sale.created_at]);
        
        // Insert sale item
        await pool.query(`
          INSERT INTO sales_saleitem (sale_id, product_id, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING
        `, [sale.id, sale.product_id, sale.quantity, sale.unit_price, sale.total_amount]);
        
      } catch (error) {
        if (error.code !== '23505') { // Ignore duplicate key errors
          console.error('Error inserting sale:', error.message);
        }
      }
    }
    
    console.log('✅ Sample data seeded successfully!');
    console.log('🤖 ML forecasting should now work with this data');
    console.log('\n🧪 Test the forecasting API:');
    console.log('curl http://localhost:8000/api/forecasting/dashboard');
    console.log('curl http://localhost:8000/api/forecasting/recommendations');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  seedSampleData();
}

module.exports = seedSampleData;