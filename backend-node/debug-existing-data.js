const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugExistingData() {
  try {
    console.log('🔍 Checking existing database structure and data...\n');
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%sale%' OR table_name LIKE '%product%'
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Check sales table structure
    const salesColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sales_sale'
    `);
    
    console.log('\n📊 sales_sale table structure:');
    salesColumns.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));
    
    // Check sales items structure
    const itemsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sales_saleitem'
    `);
    
    console.log('\n📦 sales_saleitem table structure:');
    itemsColumns.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));
    
    // Check products structure
    const productsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_product'
    `);
    
    console.log('\n🛍️ inventory_product table structure:');
    productsColumns.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));
    
    // Check actual data counts
    const salesCount = await pool.query('SELECT COUNT(*) as count FROM sales_sale');
    const itemsCount = await pool.query('SELECT COUNT(*) as count FROM sales_saleitem');
    const productsCount = await pool.query('SELECT COUNT(*) as count FROM inventory_product');
    
    console.log('\n📈 Data counts:');
    console.log(`  - Sales: ${salesCount.rows[0].count}`);
    console.log(`  - Sale Items: ${itemsCount.rows[0].count}`);
    console.log(`  - Products: ${productsCount.rows[0].count}`);
    
    // Sample recent sales data
    const recentSales = await pool.query(`
      SELECT s.id, s.business_id, s.total_amount, s.created_at,
             si.product_id, si.quantity, si.unit_price
      FROM sales_sale s
      LEFT JOIN sales_saleitem si ON s.id = si.sale_id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);
    
    console.log('\n🔍 Recent sales sample:');
    recentSales.rows.forEach(row => {
      console.log(`  - Sale ${row.id}: ₦${row.total_amount}, Product: ${row.product_id}, Qty: ${row.quantity}`);
    });
    
    // Check business IDs
    const businesses = await pool.query('SELECT DISTINCT business_id FROM sales_sale LIMIT 5');
    console.log('\n🏢 Business IDs with sales:');
    businesses.rows.forEach(row => console.log(`  - ${row.business_id}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugExistingData();