const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for pic2nav@gmail.com...');
    
    const result = await pool.query(
      'SELECT id, email, username, business_name, password FROM users WHERE email = $1',
      ['pic2nav@gmail.com']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User pic2nav@gmail.com not found');
      console.log('📋 All users in database:');
      const allUsers = await pool.query('SELECT email, username, business_name FROM users');
      allUsers.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.business_name})`);
      });
    } else {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Username: ${user.username}`);
      console.log(`  - Business: ${user.business_name}`);
      console.log(`  - Password hash: ${user.password.substring(0, 20)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUser();