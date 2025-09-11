const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkProductColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking inventory_product table structure...');
    
    // Check table columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_product' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 inventory_product columns:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Sample product data
    const sampleResult = await client.query('SELECT * FROM inventory_product LIMIT 3');
    console.log('\n📦 Sample products:');
    sampleResult.rows.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      Object.keys(product).forEach(key => {
        console.log(`  ${key}: ${product[key]}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkProductColumns();