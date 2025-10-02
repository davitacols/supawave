const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugStoreAnalytics() {
  try {
    console.log('🔍 Debugging store analytics...');
    
    const userId = '1104518454268002305';
    
    // Get all stores
    const stores = await pool.query(
      'SELECT id, name, is_main_store FROM stores WHERE user_id = $1',
      [userId]
    );
    
    console.log('📋 Stores:');
    for (const store of stores.rows) {
      console.log(`\n🏪 ${store.name} (${store.id})`);
      console.log(`   Main store: ${store.is_main_store}`);
      
      // Test the analytics logic for each store
      if (store.is_main_store) {
        console.log('   → Should show full business data');
      } else {
        console.log('   → Should show 0 data');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await pool.end();
  }
}

debugStoreAnalytics();