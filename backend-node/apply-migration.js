const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Applying inventory transfers migration...');
    
    // Create inventory_transfers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_transfers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id BIGINT NOT NULL,
        from_store_id UUID NOT NULL,
        to_store_id UUID NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_by BIGINT NOT NULL,
        approved_by BIGINT,
        completed_by BIGINT,
        created_at TIMESTAMP DEFAULT NOW(),
        approved_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    
    // Create transfer_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transfer_items (
        id SERIAL PRIMARY KEY,
        transfer_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        notes TEXT
      )
    `);
    
    // Create store_inventory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_inventory (
        id SERIAL PRIMARY KEY,
        store_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER DEFAULT 0,
        reserved_quantity INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW(),
        UNIQUE(store_id, product_id)
      )
    `);
    
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    process.exit();
  }
}

applyMigration();