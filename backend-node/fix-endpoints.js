const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixEndpoints() {
  const client = await pool.connect();
  
  try {
    console.log('Fixing common endpoint issues...');
    
    // 1. Ensure business_id columns exist where needed
    console.log('1. Checking business_id columns...');
    
    // Add business_id to tables that might be missing it
    const alterQueries = [
      `ALTER TABLE inventory_product ADD COLUMN IF NOT EXISTS business_id BIGINT`,
      `ALTER TABLE sales_sale ADD COLUMN IF NOT EXISTS business_id BIGINT`,
      `ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_id BIGINT`,
      `ALTER TABLE inventory_category ADD COLUMN IF NOT EXISTS business_id BIGINT`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_id BIGINT`,
      `ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS business_id BIGINT`
    ];
    
    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log(`✅ ${query.split(' ')[2]} updated`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log(`⚠️ ${query.split(' ')[2]}: ${error.message}`);
        }
      }
    }
    
    // 2. Update existing records to have business_id = user_id where missing
    console.log('\n2. Updating missing business_id values...');
    
    const updateQueries = [
      `UPDATE inventory_product SET business_id = user_id WHERE business_id IS NULL AND user_id IS NOT NULL`,
      `UPDATE sales_sale SET business_id = user_id WHERE business_id IS NULL AND user_id IS NOT NULL`,
      `UPDATE stores SET business_id = user_id WHERE business_id IS NULL AND user_id IS NOT NULL`,
      `UPDATE inventory_category SET business_id = user_id WHERE business_id IS NULL AND user_id IS NOT NULL`,
      `UPDATE customers SET business_id = user_id WHERE business_id IS NULL AND user_id IS NOT NULL`
    ];
    
    for (const query of updateQueries) {
      try {
        const result = await client.query(query);
        console.log(`✅ Updated ${result.rowCount} rows in ${query.split(' ')[1]}`);
      } catch (error) {
        console.log(`⚠️ ${query.split(' ')[1]}: ${error.message}`);
      }
    }
    
    // 3. Create indexes for better performance
    console.log('\n3. Creating indexes...');
    
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_inventory_product_business_id ON inventory_product(business_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sales_sale_business_id ON sales_sale(business_id)`,
      `CREATE INDEX IF NOT EXISTS idx_stores_business_id ON stores(business_id)`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_category_business_id ON inventory_category(business_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id)`
    ];
    
    for (const query of indexQueries) {
      try {
        await client.query(query);
        console.log(`✅ Index created: ${query.split(' ')[5]}`);
      } catch (error) {
        console.log(`⚠️ Index: ${error.message}`);
      }
    }
    
    console.log('\n✅ Endpoint fixes completed!');
    
  } catch (error) {
    console.error('Error fixing endpoints:', error);
  } finally {
    client.release();
    process.exit();
  }
}

fixEndpoints();