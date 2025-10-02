const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDjangoData() {
  try {
    console.log('🔍 Checking Django tables data...');
    
    const userId = '1104518454268002305';
    
    // Check inventory_product
    const products = await pool.query('SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1', [userId]);
    console.log(`📦 Products in inventory_product: ${products.rows[0].count}`);
    
    // Check sales_sale
    const sales = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales_sale WHERE business_id = $1', [userId]);
    console.log(`💰 Sales in sales_sale: ${sales.rows[0].count} transactions, ₦${sales.rows[0].revenue} revenue`);
    
    // Sample products
    const sampleProducts = await pool.query('SELECT name, stock_quantity FROM inventory_product WHERE business_id = $1 LIMIT 5', [userId]);
    console.log('\n📋 Sample products:');
    sampleProducts.rows.forEach(p => {
      console.log(`  - ${p.name}: ${p.stock_quantity} units`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDjangoData();