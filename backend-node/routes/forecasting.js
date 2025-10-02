const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const demandForecaster = require('../utils/demandForecasting');
const router = express.Router();

// Get demand forecast for a specific product
router.get('/products/:productId/forecast', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 14 } = req.query;
    
    const forecast = await demandForecaster.forecastDemand(
      req.user.business_id, 
      productId, 
      parseInt(days)
    );
    
    res.json(forecast);
  } catch (error) {
    console.error('Product forecast error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// Get reorder recommendations based on forecasting
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const recommendations = await demandForecaster.generateReorderRecommendations(
      req.user.business_id
    );
    
    res.json({
      recommendations,
      generated_at: new Date().toISOString(),
      total_items: recommendations.length
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Get product trend analysis
router.get('/products/:productId/trends', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const trends = await demandForecaster.analyzeProductTrends(
      req.user.business_id, 
      productId
    );
    
    res.json(trends);
  } catch (error) {
    console.error('Trend analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze trends' });
  }
});

// Get dashboard analytics with forecasting insights
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const recommendations = await demandForecaster.generateReorderRecommendations(
      req.user.business_id
    );
    
    const criticalItems = recommendations.filter(r => r.priority === 'critical').length;
    const highPriorityItems = recommendations.filter(r => r.priority === 'high').length;
    const totalReorderCost = recommendations.reduce((sum, r) => sum + r.estimated_cost, 0);
    
    res.json({
      critical_stockouts: criticalItems,
      high_priority_reorders: highPriorityItems,
      total_recommendations: recommendations.length,
      estimated_reorder_cost: Math.round(totalReorderCost * 100) / 100,
      recommendations: recommendations.slice(0, 10) // Top 10 recommendations
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

module.exports = router;