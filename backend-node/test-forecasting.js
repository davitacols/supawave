const demandForecaster = require('./utils/demandForecasting');

// Test the forecasting system
async function testForecasting() {
  console.log('🧪 Testing ML Demand Forecasting System...\n');
  
  try {
    // Test with a sample business ID and product ID
    const businessId = 1;
    const productId = '550e8400-e29b-41d4-a716-446655440000'; // Sample UUID
    
    console.log('📊 Testing demand forecast...');
    const forecast = await demandForecaster.forecastDemand(businessId, productId, 7);
    console.log('Forecast Result:', JSON.stringify(forecast, null, 2));
    
    console.log('\n📈 Testing trend analysis...');
    const trends = await demandForecaster.analyzeProductTrends(businessId, productId);
    console.log('Trends Result:', JSON.stringify(trends, null, 2));
    
    console.log('\n🎯 Testing reorder recommendations...');
    const recommendations = await demandForecaster.generateReorderRecommendations(businessId);
    console.log('Recommendations Result:', JSON.stringify(recommendations, null, 2));
    
    console.log('\n✅ Forecasting system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testForecasting();