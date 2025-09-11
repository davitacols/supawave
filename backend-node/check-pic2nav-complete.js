const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPic2navComplete() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Complete analysis of pic2nav@gmail.com account...\n');
    
    // 1. Find the user
    const userResult = await client.query(
      'SELECT * FROM accounts_user WHERE email = $1',
      ['pic2nav@gmail.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User pic2nav@gmail.com not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 USER INFO:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Phone: ${user.phone_number}`);
    console.log(`   Business ID: ${user.business_id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   Created: ${user.date_joined}\n`);
    
    // 2. Find associated business
    const businessResult = await client.query(
      'SELECT * FROM accounts_business WHERE owner_id = $1',
      [user.id]
    );
    
    console.log('🏢 BUSINESS INFO:');
    if (businessResult.rows.length > 0) {
      const business = businessResult.rows[0];
      console.log(`   ID: ${business.id}`);
      console.log(`   Name: ${business.name}`);
      console.log(`   Owner ID: ${business.owner_id}`);
      console.log(`   Registration Date: ${business.registration_date}`);
      console.log(`   Address: ${business.address || 'Not set'}`);
      console.log(`   Phone: ${business.phone || 'Not set'}\n`);
      
      const businessId = business.id;
      
      // 3. Check products
      const productsResult = await client.query(
        'SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1',
        [businessId]
      );
      console.log(`📦 PRODUCTS: ${productsResult.rows[0].count}`);
      
      // 4. Check sales
      const salesResult = await client.query(
        'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales_sale WHERE business_id = $1',
        [businessId]
      );
      console.log(`💰 SALES: ${salesResult.rows[0].count} sales, Total: ₦${salesResult.rows[0].total}`);
      
      // 5. Check categories
      const categoriesResult = await client.query(
        'SELECT COUNT(*) as count FROM inventory_category WHERE business_id = $1',
        [businessId]
      );
      console.log(`📋 CATEGORIES: ${categoriesResult.rows[0].count}`);
      
      // 6. Check suppliers
      const suppliersResult = await client.query(
        'SELECT COUNT(*) as count FROM inventory_supplier WHERE business_id = $1',
        [businessId]
      );
      console.log(`🏭 SUPPLIERS: ${suppliersResult.rows[0].count}`);
      
      // 7. Check stores
      const storesResult = await client.query(
        'SELECT COUNT(*) as count FROM stores_store WHERE business_id = $1',
        [businessId]
      );
      console.log(`🏪 STORES: ${storesResult.rows[0].count}`);
      
      // 8. Recent sales
      const recentSalesResult = await client.query(
        'SELECT id, total_amount, created_at FROM sales_sale WHERE business_id = $1 ORDER BY created_at DESC LIMIT 5',
        [businessId]
      );
      console.log('\n💳 RECENT SALES:');
      recentSalesResult.rows.forEach((sale, index) => {
        console.log(`   ${index + 1}. ₦${sale.total_amount} on ${sale.created_at.toDateString()}`);
      });
      
      // 9. Top products by quantity
      const topProductsResult = await client.query(
        'SELECT name, quantity, price FROM inventory_product WHERE business_id = $1 ORDER BY quantity DESC LIMIT 5',
        [businessId]
      );
      console.log('\n📈 TOP PRODUCTS BY STOCK:');
      topProductsResult.rows.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - Qty: ${product.quantity}, Price: ₦${product.price}`);
      });
      
    } else {
      console.log('   ❌ No business found for this user');
      
      // Check if user has business_id but no business record
      if (user.business_id) {
        const orphanBusinessResult = await client.query(
          'SELECT * FROM accounts_business WHERE id = $1',
          [user.business_id]
        );
        
        if (orphanBusinessResult.rows.length > 0) {
          console.log(`   ⚠️  User points to business ID ${user.business_id} but owner_id doesn't match`);
          console.log(`   Business: ${orphanBusinessResult.rows[0].name}`);
          console.log(`   Owner ID: ${orphanBusinessResult.rows[0].owner_id}`);
        } else {
          console.log(`   ⚠️  User points to non-existent business ID ${user.business_id}`);
        }
      }
    }
    
    // 10. Check if there are any businesses this user should own
    const allBusinessesResult = await client.query(
      'SELECT * FROM accounts_business ORDER BY registration_date DESC'
    );
    
    console.log('\n🏢 ALL BUSINESSES:');
    allBusinessesResult.rows.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name} (ID: ${business.id}, Owner: ${business.owner_id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPic2navComplete();