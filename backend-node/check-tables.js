const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    console.log('🔍 Checking available tables...');
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check user data
    const userId = '1104518454268002305';
    
    // Check products
    const products = await pool.query('SELECT COUNT(*) as count FROM products WHERE user_id = $1', [userId]);
    console.log(`\n📦 Products for user: ${products.rows[0].count}`);
    
    // Check sales
    const sales = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM sales WHERE user_id = $1', [userId]);
    console.log(`💰 Sales for user: ${sales.rows[0].count} transactions, ₦${sales.rows[0].revenue} revenue`);
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await pool.end();
  }
}

checkTables();