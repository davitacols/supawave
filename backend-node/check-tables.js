const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('Checking database tables...');
    
    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check if main tables exist and create them if not
    const requiredTables = [
      'accounts_user',
      'accounts_business', 
      'inventory_product',
      'inventory_category',
      'sales_sale',
      'sales_saleitem',
      'stores',
      'inventory_transfers',
      'transfer_items',
      'store_inventory'
    ];
    
    console.log('\nChecking required tables...');
    for (const table of requiredTables) {
      const exists = tablesResult.rows.some(row => row.table_name === table);
      console.log(`${table}: ${exists ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    client.release();
    process.exit();
  }
}

checkTables();