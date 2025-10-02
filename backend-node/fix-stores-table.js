const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixStoresTable() {
  try {
    console.log('🔄 Fixing stores table...');
    
    // Drop and recreate stores table with correct user_id type
    await pool.query('DROP TABLE IF EXISTS store_transfers CASCADE');
    await pool.query('DROP TABLE IF EXISTS stores CASCADE');
    
    // Create stores table with TEXT user_id
    await pool.query(`
      CREATE TABLE stores (
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
    
    console.log('✅ Stores table recreated with TEXT user_id');
    
    // Create main store for the user
    await pool.query(
      `INSERT INTO stores (user_id, name, is_main_store, is_active) 
       VALUES ($1, 'Main Store', true, true)`,
      ['1104518454268002305']
    );
    
    console.log('✅ Created main store');
    console.log('🎉 Stores table fixed!');
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await pool.end();
  }
}

fixStoresTable();