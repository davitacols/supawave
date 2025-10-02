const demandForecaster = require('./utils/demandForecasting');
require('dotenv').config();

async function testWithRealData() {
  console.log('🧪 Testing ML Forecasting with Real Data...\n');
  
  try {
    // Use actual business ID from your data
    const businessId = 1103754702918615041;
    
    console.log('🎯 Testing reorder recommendations...');
    const recommendations = await demandForecaster.generateReorderRecommendations(businessId);
    
    console.log(`📊 Found ${recommendations.length} recommendations:`);
    recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`\n${i + 1}. ${rec.product_name}`);
      console.log(`   Stock: ${rec.current_stock}`);
      console.log(`   Daily Demand: ${rec.predicted_daily_demand}`);
      console.log(`   Days Left: ${rec.days_until_stockout}`);
      console.log(`   Priority: ${rec.priority}`);
      console.log(`   Confidence: ${rec.confidence}`);
    });
    
    if (recommendations.length === 0) {
      console.log('ℹ️  No recommendations - this could mean:');
      console.log('   - All products have sufficient stock');
      console.log('   - Need more sales history for accurate predictions');
      console.log('   - Products may not have recent sales data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testWithRealData();