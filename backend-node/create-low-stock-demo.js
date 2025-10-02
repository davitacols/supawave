const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createLowStockDemo() {
  console.log('🎯 Creating low stock demo for ML recommendations...\n');
  
  try {
    // Get a business with products
    const business = await pool.query(`
      SELECT DISTINCT business_id 
      FROM inventory_product 
      WHERE is_active = true 
      LIMIT 1
    `);
    
    if (business.rows.length === 0) {
      console.log('❌ No businesses with products found');
      return;
    }
    
    const businessId = business.rows[0].business_id;
    console.log(`🏢 Using business ID: ${businessId}`);
    
    // Get some products and set them to low stock
    const products = await pool.query(`
      SELECT id, name, stock_quantity, low_stock_threshold
      FROM inventory_product 
      WHERE business_id = $1 AND is_active = true
      LIMIT 3
    `, [businessId]);
    
    console.log(`📦 Found ${products.rows.length} products to modify:`);
    
    for (const product of products.rows) {
      // Set stock to below threshold to trigger recommendations
      const newStock = Math.max(1, Math.floor(product.low_stock_threshold / 2));
      
      await pool.query(`
        UPDATE inventory_product 
        SET stock_quantity = $1, reorder_point = $2
        WHERE id = $3
      `, [newStock, product.low_stock_threshold + 5, product.id]);
      
      console.log(`✅ ${product.name}: Stock ${product.stock_quantity} → ${newStock} (threshold: ${product.low_stock_threshold})`);
    }
    
    console.log('\n🎉 Demo setup complete!');
    console.log('Now test the ML recommendations:');
    console.log('curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/forecasting/recommendations');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createLowStockDemo();