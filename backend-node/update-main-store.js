const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateMainStore() {
  try {
    console.log('🔄 Updating main store to reflect default account...');
    
    const userId = '1104518454268002305';
    
    await pool.query(
      `UPDATE stores SET 
       name = 'Default Account', 
       address = 'Primary business location',
       manager_name = 'Business Owner'
       WHERE user_id = $1 AND is_main_store = true`,
      [userId]
    );
    
    console.log('✅ Main store updated to represent default account');
    console.log('🎉 Update completed!');
  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await pool.end();
  }
}

updateMainStore();