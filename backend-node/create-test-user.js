const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTestUser() {
  const client = await pool.connect();
  
  try {
    console.log('👤 Creating test user...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const result = await client.query(
      `INSERT INTO users (username, email, password, first_name, last_name, business_name, phone_number, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
       RETURNING id, username, email, first_name, last_name, business_name`,
      ['testuser', 'test@example.com', hashedPassword, 'John', 'Doe', 'Test Store', '+1234567890']
    );
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: password123');
    console.log('🏪 Business: Test Store');
    console.log('');
    console.log('🚀 You can now login with these credentials!');
    
  } catch (error) {
    if (error.code === '23505') {
      console.log('ℹ️  Test user already exists!');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: password123');
    } else {
      console.error('❌ Failed to create test user:', error);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUser();