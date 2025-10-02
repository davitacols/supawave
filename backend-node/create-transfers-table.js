const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTransfersTable() {
  try {
    console.log('🔄 Creating store_transfers table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_transfers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        from_store_id UUID NOT NULL REFERENCES stores(id),
        to_store_id UUID NOT NULL REFERENCES stores(id),
        product_id UUID NOT NULL REFERENCES products(id),
        quantity INT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );
    `);
    
    console.log('✅ store_transfers table created');
    console.log('🎉 Transfers table setup completed!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await pool.end();
  }
}

createTransfersTable();