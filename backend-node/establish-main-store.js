const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function establishMainStore() {
  try {
    console.log('🔄 Establishing main store properly...');
    
    const userId = '1104518454268002305';
    
    // First, unset all main stores for this user
    await pool.query(
      'UPDATE stores SET is_main_store = false WHERE user_id = $1',
      [userId]
    );
    
    // Set the "Default Account" as the main store
    const result = await pool.query(
      `UPDATE stores SET is_main_store = true 
       WHERE user_id = $1 AND name = 'Default Account'
       RETURNING *`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // If no "Default Account" exists, create it
      await pool.query(
        `INSERT INTO stores (user_id, name, address, manager_name, is_main_store, is_active) 
         VALUES ($1, 'Default Account', 'Primary business location', 'Business Owner', true, true)`,
        [userId]
      );
      console.log('✅ Created and established Default Account as main store');
    } else {
      console.log('✅ Established Default Account as main store');
    }
    
    // Show current stores
    const stores = await pool.query(
      'SELECT name, is_main_store FROM stores WHERE user_id = $1 ORDER BY is_main_store DESC',
      [userId]
    );
    
    console.log('📋 Current stores:');
    stores.rows.forEach(store => {
      console.log(`  - ${store.name} ${store.is_main_store ? '(MAIN)' : ''}`);
    });
    
    console.log('🎉 Main store established!');
  } catch (error) {
    console.error('❌ Failed to establish main store:', error);
  } finally {
    await pool.end();
  }
}

establishMainStore();