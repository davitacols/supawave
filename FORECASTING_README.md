# 🤖 ML-Powered Demand Forecasting System

## Overview
SupaWave now includes advanced machine learning capabilities for demand forecasting and predictive inventory management, specifically designed for African SMEs.

## Features

### 🎯 Core ML Capabilities
- **Seasonal Pattern Recognition** - Detects weekly and monthly sales patterns
- **Trend Analysis** - Identifies growing, declining, or stable product trends
- **Demand Prediction** - Forecasts daily/weekly demand using exponential smoothing
- **Smart Reorder Recommendations** - AI-powered purchase suggestions
- **Stockout Prevention** - Predicts when products will run out

### 📊 Forecasting Algorithms
- **Moving Average** - Smooths out short-term fluctuations
- **Exponential Smoothing** - Gives more weight to recent data
- **Seasonal Adjustment** - Accounts for weekly/monthly patterns
- **Volatility Analysis** - Measures demand stability

## API Endpoints

### Forecasting Routes (`/api/forecasting/`)

```javascript
// Get demand forecast for specific product
GET /api/forecasting/products/:productId/forecast?days=14

// Get AI-powered reorder recommendations
GET /api/forecasting/recommendations

// Get product trend analysis
GET /api/forecasting/products/:productId/trends

// Get forecasting dashboard summary
GET /api/forecasting/dashboard
```

### Enhanced Inventory Routes

```javascript
// Enhanced alerts with ML insights
GET /api/inventory/alerts

// Smart reorder with ML recommendations
GET /api/inventory/smart-reorder
```

## Usage Examples

### 1. Get Product Forecast
```javascript
const forecast = await api.get('/forecasting/products/123/forecast?days=7');
console.log(forecast.data);
// Returns: { forecast: [...], confidence: 'high', historical_avg: 15.2 }
```

### 2. Get Reorder Recommendations
```javascript
const recommendations = await api.get('/forecasting/recommendations');
console.log(recommendations.data);
// Returns: { recommendations: [...], total_items: 5, generated_at: "..." }
```

### 3. Analyze Product Trends
```javascript
const trends = await api.get('/forecasting/products/123/trends');
console.log(trends.data);
// Returns: { trend: 'growing', trend_percentage: 25.5, volatility: 0.15 }
```

## Frontend Components

### Enhanced Components
- **DemandForecast.js** - Real-time ML forecasting dashboard
- **SmartReorder.js** - AI-powered reorder recommendations
- **Enhanced Inventory Alerts** - ML-enhanced stock alerts

### Key Features
- Real-time confidence indicators
- Visual trend charts
- Priority-based recommendations
- Cost estimation for reorders

## Configuration

### Environment Variables
No additional environment variables needed - uses existing database connection.

### Database Requirements
- Requires sales history data (minimum 7 days for basic forecasting)
- Better accuracy with 30+ days of sales data
- Uses existing `sales_sale` and `sales_saleitem` tables

## Algorithm Details

### Seasonal Factors
```javascript
weekly: [1.0, 0.8, 0.9, 1.1, 1.2, 1.3, 1.1]  // Mon-Sun multipliers
monthly: [0.9, 0.8, 1.0, 1.1, 1.2, 1.3, 1.4, 1.2, 1.1, 1.0, 1.3, 1.5]  // Jan-Dec
```

### Confidence Levels
- **High (90%)** - 30+ days of sales data
- **Medium (70%)** - 7-30 days of sales data  
- **Low (50%)** - Less than 7 days of data

### Priority Levels
- **Critical** - Stockout in ≤3 days
- **High** - Stockout in 4-7 days
- **Medium** - Stockout in 8-14 days

## Testing

Run the forecasting test:
```bash
cd backend-node
node test-forecasting.js
```

## Benefits for African SMEs

### 🎯 Problem Solving
- **Reduces Stockouts** - Predict demand before running out
- **Optimizes Cash Flow** - Order right quantities at right time
- **Seasonal Awareness** - Accounts for local buying patterns
- **Cost Reduction** - Minimize overstock and waste

### 📈 Business Impact
- **Improved Sales** - Never miss sales due to stockouts
- **Better Planning** - Data-driven inventory decisions
- **Competitive Advantage** - AI-powered insights
- **Growth Support** - Scale inventory with confidence

## Future Enhancements

### Planned Features
- **External Data Integration** - Weather, holidays, events
- **Supplier Lead Time** - Factor in delivery times
- **Price Optimization** - Dynamic pricing based on demand
- **Multi-location Forecasting** - Chain store support
- **Mobile Notifications** - Real-time alerts

### Advanced ML
- **Neural Networks** - Deep learning for complex patterns
- **Ensemble Methods** - Combine multiple algorithms
- **Real-time Learning** - Continuous model improvement
- **Anomaly Detection** - Identify unusual demand patterns

## Support

For issues or questions about the forecasting system:
1. Check the console logs for detailed error messages
2. Verify sufficient sales history exists
3. Test with the provided test script
4. Review API response formats in the code

The system gracefully falls back to basic inventory alerts if ML forecasting fails, ensuring business continuity.