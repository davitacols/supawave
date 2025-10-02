const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔄 Running manager-store system migration...');
    
    const migration = fs.readFileSync('./migrations/manager-store-system.sql', 'utf8');
    await pool.query(migration);
    
    console.log('✅ Manager-store system migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();