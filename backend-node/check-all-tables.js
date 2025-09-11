const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAllTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking all tables in CockroachDB...');
    console.log('');
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Total tables found: ${tablesResult.rows.length}`);
    console.log('');
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`📋 Table: ${tableName}`);
      
      try {
        // Get row count for each table
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   Rows: ${countResult.rows[0].count}`);
        
        // If table has data, show first few rows
        if (parseInt(countResult.rows[0].count) > 0) {
          const sampleResult = await client.query(`SELECT * FROM ${tableName} LIMIT 3`);
          console.log(`   Sample data:`);
          sampleResult.rows.forEach((row, index) => {
            console.log(`     Row ${index + 1}:`, Object.keys(row).slice(0, 3).map(key => `${key}: ${row[key]}`).join(', '));
          });
        }
      } catch (error) {
        console.log(`   Error checking table: ${error.message}`);
      }
      console.log('');
    }
    
    // Check for Django-style tables specifically
    console.log('🔍 Looking for Django tables...');
    const djangoTables = ['auth_user', 'accounts_business', 'accounts_customuser', 'inventory_product', 'sales_sale'];
    
    for (const tableName of djangoTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.log(`❌ ${tableName}: Table not found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllTables();