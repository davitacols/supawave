const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migratePOSFeatures() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting POS features migration...');
    
    // Create customers table first
    const createCustomersTable = `
      CREATE TABLE IF NOT EXISTS customers_customer (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client.query(createCustomersTable);
    console.log('✅ Created customers_customer table');
    
    // Add new columns to sales_sale table
    const alterSalesTable = `
      ALTER TABLE sales_sale 
      ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_id UUID,
      ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash',
      ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `;
    
    await client.query(alterSalesTable);
    console.log('✅ Enhanced sales_sale table with new POS fields');
    
    // Add foreign key constraint after both tables exist
    const addForeignKey = `
      ALTER TABLE sales_sale 
      ADD CONSTRAINT fk_sales_customer 
      FOREIGN KEY (customer_id) REFERENCES customers_customer(id);
    `;
    
    try {
      await client.query(addForeignKey);
      console.log('✅ Added foreign key constraint');
    } catch (error) {
      if (error.code !== '42710') { // Ignore if constraint already exists
        console.log('⚠️ Foreign key constraint may already exist');
      }
    }
    
    // Create index for better performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers_customer(business_id);
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers_customer(phone);
      CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales_sale(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales_sale(payment_method);
    `;
    
    await client.query(createIndexes);
    console.log('✅ Created performance indexes');
    
    // Update existing sales with subtotal where missing
    const updateSubtotals = `
      UPDATE sales_sale 
      SET subtotal = total_amount 
      WHERE subtotal IS NULL;
    `;
    
    await client.query(updateSubtotals);
    console.log('✅ Updated existing sales with subtotal values');
    
    console.log('🎉 POS features migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migratePOSFeatures().catch(console.error);