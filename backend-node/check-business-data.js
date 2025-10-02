const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkBusinessData() {
  try {
    console.log('🔍 Checking business data...');
    
    const userId = '1104518454268002305';
    const businessId = '1104518460022685697';
    
    // Check inventory_product with business_id
    const products = await pool.query('SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1', [businessId]);
    console.log(`📦 Products for business ${businessId}: ${products.rows[0].count}`);
    
    // Check sales_sale with business_id
    const sales = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales_sale WHERE business_id = $1', [businessId]);
    console.log(`💰 Sales for business ${businessId}: ${sales.rows[0].count} transactions, ₦${sales.rows[0].revenue} revenue`);
    
    // Sample products
    const sampleProducts = await pool.query('SELECT name, stock_quantity FROM inventory_product WHERE business_id = $1 LIMIT 5', [businessId]);
    console.log('\n📋 Sample products:');
    sampleProducts.rows.forEach(p => {
      console.log(`  - ${p.name}: ${p.stock_quantity} units`);
    });
    
    // Sample sales
    const sampleSales = await pool.query('SELECT total_amount, created_at FROM sales_sale WHERE business_id = $1 LIMIT 5', [businessId]);
    console.log('\n💰 Sample sales:');
    sampleSales.rows.forEach(s => {
      console.log(`  - ₦${s.total_amount} on ${s.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await pool.end();
  }
}

checkBusinessData();