const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testDatabase() {
  console.log('🔍 Testing CockroachDB connection...');
  console.log('📡 Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to CockroachDB!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Current time:', result.rows[0].current_time);
    
    // Check if users table exists and has data
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users in database:', usersResult.rows[0].count);
    
    // List all users
    const allUsers = await client.query('SELECT id, email, username, business_name FROM users');
    console.log('📋 All users:');
    allUsers.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.business_name})`);
    });
    
    client.release();
    console.log('🎉 Database connection test successful!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Error details:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();