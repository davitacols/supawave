const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDjangoUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Django user structure...');
    
    // Check accounts_user table structure
    const userColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'accounts_user' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 accounts_user columns:');
    userColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Find pic2nav@gmail.com user
    const userResult = await client.query(
      'SELECT id, username, email, first_name, last_name, phone_number FROM accounts_user WHERE email = $1',
      ['pic2nav@gmail.com']
    );
    
    if (userResult.rows.length > 0) {
      console.log('✅ Found pic2nav@gmail.com in Django table:');
      console.log(userResult.rows[0]);
    } else {
      console.log('❌ pic2nav@gmail.com not found in Django table');
      
      // Show all users
      const allUsers = await client.query('SELECT id, username, email FROM accounts_user LIMIT 5');
      console.log('📋 Sample Django users:');
      allUsers.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.username})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDjangoUser();