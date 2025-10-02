const express = require('express');
const { Pool } = require('pg');
const demandForecaster = require('./utils/demandForecasting');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testWithAuth() {
  console.log('🧪 Testing with authenticated business data...\n');
  
  try {
    // Get all business IDs that have sales
    const businesses = await pool.query(`
      SELECT DISTINCT s.business_id, COUNT(*) as sales_count
      FROM sales_sale s
      GROUP BY s.business_id
      ORDER BY sales_count DESC
    `);
    
    console.log('🏢 Businesses with sales:');
    businesses.rows.forEach(row => {
      console.log(`  - Business ${row.business_id}: ${row.sales_count} sales`);
    });
    
    // Test with the first business that has sales
    if (businesses.rows.length > 0) {
      const businessId = businesses.rows[0].business_id;
      console.log(`\n🎯 Testing with Business ID: ${businessId}`);
      
      // Check products for this business
      const products = await pool.query(`
        SELECT id, name, stock_quantity, low_stock_threshold, reorder_point
        FROM inventory_product 
        WHERE business_id = $1 AND is_active = true
        LIMIT 5
      `, [businessId]);
      
      console.log(`\n📦 Products for this business: ${products.rows.length}`);
      products.rows.forEach(product => {
        console.log(`  - ${product.name}: Stock ${product.stock_quantity}, Threshold ${product.low_stock_threshold}`);
      });
      
      // Check recent sales for these products
      if (products.rows.length > 0) {
        const productId = products.rows[0].id;
        console.log(`\n📊 Testing forecast for: ${products.rows[0].name}`);
        
        const salesHistory = await demandForecaster.getProductSalesHistory(businessId, productId, 30);
        console.log(`Sales history entries: ${salesHistory.length}`);
        
        if (salesHistory.length > 0) {
          console.log('Recent sales:');
          salesHistory.slice(-5).forEach(sale => {
            console.log(`  - ${sale.sale_date}: ${sale.daily_quantity} units`);
          });
          
          const forecast = await demandForecaster.forecastDemand(businessId, productId, 7);
          console.log('\nForecast result:', JSON.stringify(forecast, null, 2));
        }
      }
      
      // Test recommendations
      console.log('\n🎯 Testing recommendations...');
      const recommendations = await demandForecaster.generateReorderRecommendations(businessId);
      console.log(`Found ${recommendations.length} recommendations`);
      
      if (recommendations.length > 0) {
        recommendations.slice(0, 3).forEach(rec => {
          console.log(`\n- ${rec.product_name}`);
          console.log(`  Stock: ${rec.current_stock}, Priority: ${rec.priority}`);
          console.log(`  Days left: ${rec.days_until_stockout}`);
        });
      } else {
        console.log('No recommendations found. This could mean:');
        console.log('- All products have sufficient stock levels');
        console.log('- Products need more sales history');
        console.log('- Stock levels are above reorder points');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testWithAuth();