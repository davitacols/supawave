const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createPic2navUser() {
  const client = await pool.connect();
  
  try {
    console.log('👤 Creating pic2nav@gmail.com user...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const result = await client.query(
      `INSERT INTO users (username, email, password, first_name, last_name, business_name, phone_number, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
       RETURNING id, username, email, first_name, last_name, business_name`,
      ['pic2nav', 'pic2nav@gmail.com', hashedPassword, 'Pic2Nav', 'User', 'SupaWave Business', '+1234567890']
    );
    
    console.log('✅ pic2nav@gmail.com user created successfully!');
    console.log('📧 Email: pic2nav@gmail.com');
    console.log('🔑 Password: password123');
    console.log('🏪 Business: SupaWave Business');
    console.log('');
    console.log('🚀 You can now login with these credentials!');
    
  } catch (error) {
    if (error.code === '23505') {
      console.log('ℹ️  pic2nav@gmail.com user already exists!');
      console.log('📧 Email: pic2nav@gmail.com');
      console.log('🔑 Password: password123');
    } else {
      console.error('❌ Failed to create user:', error);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

createPic2navUser();