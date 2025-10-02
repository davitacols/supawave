const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createStoresSimple() {
  try {
    console.log('🔄 Creating stores table for existing system...');
    
    // Create stores table with string user_id to match existing system
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        manager_name VARCHAR(255),
        is_main_store BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('✅ Stores table created');
    
    // Create a main store for the current user
    const userId = '1104518454268002305'; // The user ID from the logs
    
    const existingStore = await pool.query(
      'SELECT id FROM stores WHERE user_id = $1 AND is_main_store = true',
      [userId]
    );
    
    if (existingStore.rows.length === 0) {
      await pool.query(
        `INSERT INTO stores (user_id, name, is_main_store, is_active) 
         VALUES ($1, 'Main Store', true, true)`,
        [userId]
      );
      console.log('✅ Created main store for user');
    }
    
    console.log('🎉 Simple stores setup completed!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await pool.end();
  }
}

createStoresSimple();