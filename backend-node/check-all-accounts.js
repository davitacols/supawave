const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAllAccounts() {
  const client = await pool.connect();
  
  try {
    console.log('🏢 Checking all business accounts in CockroachDB...');
    console.log('');
    
    // Get all users with detailed info
    const result = await client.query(`
      SELECT 
        id, 
        username, 
        email, 
        first_name, 
        last_name, 
        business_name, 
        phone_number,
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Total accounts found: ${result.rows.length}`);
    console.log('');
    
    if (result.rows.length === 0) {
      console.log('❌ No accounts found in database');
    } else {
      result.rows.forEach((user, index) => {
        console.log(`🏪 Account ${index + 1}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Name: ${user.first_name} ${user.last_name}`);
        console.log(`   Business: ${user.business_name}`);
        console.log(`   Phone: ${user.phone_number}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }
    
    // Check if there are any products
    const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
    console.log(`📦 Total products: ${productsResult.rows[0].count}`);
    
    // Check if there are any sales
    const salesResult = await client.query('SELECT COUNT(*) as count FROM sales');
    console.log(`💰 Total sales: ${salesResult.rows[0].count}`);
    
    // Check if there are any customers
    const customersResult = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log(`👥 Total customers: ${customersResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error checking accounts:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllAccounts();