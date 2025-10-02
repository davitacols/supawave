// Use the same connection pattern as the server
let pool = null;

const getPool = () => {
  if (!pool) {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
};

class DemandForecaster {
  constructor() {
    this.seasonalFactors = {
      weekly: [1.0, 0.8, 0.9, 1.1, 1.2, 1.3, 1.1], // Mon-Sun
      monthly: [0.9, 0.8, 1.0, 1.1, 1.2, 1.3, 1.4, 1.2, 1.1, 1.0, 1.3, 1.5] // Jan-Dec
    };
  }

  // Simple moving average
  calculateMovingAverage(data, window = 7) {
    if (data.length < window) return data[data.length - 1] || 0;
    
    const recent = data.slice(-window);
    return recent.reduce((sum, val) => sum + val, 0) / window;
  }

  // Exponential smoothing for trend analysis
  exponentialSmoothing(data, alpha = 0.3) {
    if (data.length === 0) return 0;
    if (data.length === 1) return data[0];
    
    let smoothed = data[0];
    for (let i = 1; i < data.length; i++) {
      smoothed = alpha * data[i] + (1 - alpha) * smoothed;
    }
    return smoothed;
  }

  // Calculate seasonal adjustment
  getSeasonalFactor(date) {
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    
    const weeklyFactor = this.seasonalFactors.weekly[dayOfWeek];
    const monthlyFactor = this.seasonalFactors.monthly[month];
    
    return (weeklyFactor + monthlyFactor) / 2;
  }

  // Get historical sales data for a product
  async getProductSalesHistory(businessId, productId, days = 90) {
    try {
      const result = await getPool().query(`
        SELECT 
          DATE(s.created_at) as sale_date,
          SUM(si.quantity) as daily_quantity
        FROM sales_sale s
        JOIN sales_saleitem si ON s.id = si.sale_id
        WHERE s.business_id = $1 
        AND si.product_id = $2
        AND s.created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(s.created_at)
        ORDER BY sale_date
      `, [businessId, productId]);
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching sales history:', error.message);
      return [];
    }
  }

  // Forecast demand for next N days
  async forecastDemand(businessId, productId, forecastDays = 14) {
    try {
      const salesHistory = await this.getProductSalesHistory(businessId, productId);
      
      if (salesHistory.length < 7) {
        return { forecast: [], confidence: 'low', message: 'Insufficient data' };
      }

      const quantities = salesHistory.map(row => parseInt(row.daily_quantity));
      const movingAvg = this.calculateMovingAverage(quantities, 7);
      const trend = this.exponentialSmoothing(quantities, 0.3);
      
      const forecasts = [];
      const today = new Date();
      
      for (let i = 1; i <= forecastDays; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);
        
        const seasonalFactor = this.getSeasonalFactor(forecastDate);
        const baseForecast = (movingAvg + trend) / 2;
        const adjustedForecast = Math.max(0, Math.round(baseForecast * seasonalFactor));
        
        forecasts.push({
          date: forecastDate.toISOString().split('T')[0],
          predicted_demand: adjustedForecast,
          confidence: salesHistory.length > 30 ? 'high' : 'medium'
        });
      }

      return {
        forecast: forecasts,
        confidence: salesHistory.length > 30 ? 'high' : 'medium',
        historical_avg: movingAvg,
        trend_factor: trend
      };
    } catch (error) {
      console.error('Forecasting error:', error);
      return { forecast: [], confidence: 'low', message: 'Forecasting failed' };
    }
  }

  // Generate reorder recommendations
  async generateReorderRecommendations(businessId) {
    try {
      const products = await getPool().query(`
        SELECT id, name, stock_quantity, low_stock_threshold, 
               reorder_point, selling_price, cost_price
        FROM inventory_product 
        WHERE business_id = $1 AND is_active = true
      `, [businessId]);

      const recommendations = [];

      for (const product of products.rows) {
        const forecast = await this.forecastDemand(businessId, product.id, 14);
        
        if (forecast.forecast.length > 0) {
          const totalPredictedDemand = forecast.forecast.reduce((sum, f) => sum + f.predicted_demand, 0);
          const avgDailyDemand = totalPredictedDemand / forecast.forecast.length;
          
          // Calculate days until stockout
          const daysUntilStockout = product.stock_quantity / Math.max(avgDailyDemand, 0.1);
          
          // Recommend reorder if stock will run out in next 7 days
          if (daysUntilStockout <= 7 || product.stock_quantity <= product.reorder_point) {
            const suggestedQuantity = Math.ceil(avgDailyDemand * 21); // 3 weeks supply
            
            recommendations.push({
              product_id: product.id,
              product_name: product.name,
              current_stock: parseInt(product.stock_quantity),
              predicted_daily_demand: Math.round(avgDailyDemand * 100) / 100,
              days_until_stockout: Math.round(daysUntilStockout * 10) / 10,
              suggested_order_quantity: suggestedQuantity,
              priority: daysUntilStockout <= 3 ? 'critical' : daysUntilStockout <= 7 ? 'high' : 'medium',
              confidence: forecast.confidence,
              estimated_cost: suggestedQuantity * (parseFloat(product.cost_price) || parseFloat(product.selling_price) * 0.7)
            });
          }
        }
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 3, high: 2, medium: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error generating recommendations:', error.message);
      return [];
    }
  }

  // Analyze product performance trends
  async analyzeProductTrends(businessId, productId) {
    try {
      const salesHistory = await this.getProductSalesHistory(businessId, productId, 60);
      
      if (salesHistory.length < 14) {
        return { trend: 'insufficient_data', message: 'Need more sales data' };
      }

      const quantities = salesHistory.map(row => parseInt(row.daily_quantity));
      const firstHalf = quantities.slice(0, Math.floor(quantities.length / 2));
      const secondHalf = quantities.slice(Math.floor(quantities.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      const trendPercentage = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      let trend = 'stable';
      if (trendPercentage > 15) trend = 'growing';
      else if (trendPercentage < -15) trend = 'declining';
      
      return {
        trend,
        trend_percentage: Math.round(trendPercentage * 100) / 100,
        first_period_avg: Math.round(firstAvg * 100) / 100,
        second_period_avg: Math.round(secondAvg * 100) / 100,
        volatility: this.calculateVolatility(quantities)
      };
    } catch (error) {
      console.error('Error analyzing trends:', error.message);
      return { trend: 'error', message: 'Analysis failed' };
    }
  }

  // Calculate demand volatility
  calculateVolatility(data) {
    if (data.length < 2) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const volatility = Math.sqrt(variance) / mean;
    
    return Math.round(volatility * 1000) / 1000;
  }
}

module.exports = new DemandForecaster();