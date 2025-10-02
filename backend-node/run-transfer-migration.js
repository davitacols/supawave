const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔄 Running inventory transfer migration...');
    
    const migration = fs.readFileSync('./migrations/inventory-transfers.sql', 'utf8');
    await pool.query(migration);
    
    console.log('✅ Inventory transfer migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();