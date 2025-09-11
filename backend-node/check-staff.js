const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkStaff() {
  const client = await pool.connect();
  
  try {
    console.log('👥 Checking staff for Pic2Nav business...');
    
    // Get Pic2Nav business ID
    const businessResult = await client.query(
      'SELECT id FROM accounts_business WHERE name = $1',
      ['Pic2Nav']
    );
    
    if (businessResult.rows.length === 0) {
      console.log('❌ Pic2Nav business not found');
      return;
    }
    
    const businessId = businessResult.rows[0].id;
    console.log('🏢 Pic2Nav Business ID:', businessId);
    
    // Check all users in this business
    const allUsersResult = await client.query(
      'SELECT id, username, first_name, last_name, email, role FROM accounts_user WHERE business_id = $1::bigint',
      [businessId]
    );
    
    console.log('\n👤 All users in Pic2Nav business:');
    allUsersResult.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (${user.username}) - Role: ${user.role}`);
    });
    
    // Check specifically for managers and cashiers
    const staffResult = await client.query(
      `SELECT id, username, first_name, last_name, email, phone_number, role, is_active_staff
       FROM accounts_user 
       WHERE business_id = $1::bigint AND role IN ('manager', 'cashier')
       ORDER BY first_name, last_name`,
      [businessId]
    );
    
    console.log('\n👥 Staff (managers and cashiers):');
    if (staffResult.rows.length === 0) {
      console.log('  No staff found (managers or cashiers)');
    } else {
      staffResult.rows.forEach((staff, index) => {
        console.log(`  ${index + 1}. ${staff.first_name} ${staff.last_name} - ${staff.role} - Active: ${staff.is_active_staff}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStaff();