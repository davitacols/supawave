const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔄 Running store migration...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'add-stores.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Store migration completed successfully');
    
    // Create a default main store for existing users
    const usersResult = await pool.query('SELECT id FROM users LIMIT 5');
    
    for (const user of usersResult.rows) {
      const existingStore = await pool.query(
        'SELECT id FROM stores WHERE user_id = $1 AND is_main_store = true',
        [user.id]
      );
      
      if (existingStore.rows.length === 0) {
        await pool.query(
          `INSERT INTO stores (user_id, name, is_main_store, is_active) 
           VALUES ($1, 'Main Store', true, true)`,
          [user.id]
        );
        console.log(`✅ Created main store for user ${user.id}`);
      }
    }
    
    console.log('🎉 Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();