const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

console.log('🤖 Claude API Key configured:', !!process.env.CLAUDE_API_KEY);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get business context for AI with forecasting insights
const getBusinessContext = async (businessId) => {
  try {
    const demandForecaster = require('../utils/demandForecasting');
    
    const [products, sales, lowStock] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1', [businessId]),
      pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales_sale WHERE business_id = $1 AND created_at >= NOW() - INTERVAL \'30 days\'', [businessId]),
      pool.query('SELECT COUNT(*) as count FROM inventory_product WHERE business_id = $1 AND stock_quantity <= low_stock_threshold', [businessId])
    ]);
    
    // Get forecasting insights
    let forecastingInsights = null;
    try {
      const recommendations = await demandForecaster.generateReorderRecommendations(businessId);
      const criticalItems = recommendations.filter(r => r.priority === 'critical').length;
      const totalReorderCost = recommendations.reduce((sum, r) => sum + r.estimated_cost, 0);
      
      forecastingInsights = {
        criticalStockouts: criticalItems,
        totalRecommendations: recommendations.length,
        estimatedReorderCost: totalReorderCost
      };
    } catch (error) {
      console.log('Forecasting insights unavailable:', error.message);
    }
    
    return {
      totalProducts: products.rows[0].count,
      monthlySales: sales.rows[0].count,
      monthlyRevenue: sales.rows[0].revenue,
      lowStockItems: lowStock.rows[0].count,
      forecasting: forecastingInsights
    };
  } catch (error) {
    console.error('Error getting business context:', error);
    return null;
  }
};

// Chat with AI assistant
router.post('/chat', authenticateToken, async (req, res) => {
  let context = null;
  
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get business context
    context = await getBusinessContext(req.user.business_id);
    
    const systemPrompt = `You are a helpful AI business assistant for SupaWave, an inventory management system for African SMEs with advanced ML-powered demand forecasting. 

Business Context:
${context ? `- Total Products: ${context.totalProducts}
- Monthly Sales: ${context.monthlySales}
- Monthly Revenue: ₦${context.monthlyRevenue}
- Low Stock Items: ${context.lowStockItems}${context.forecasting ? `
- Critical Stockouts Predicted: ${context.forecasting.criticalStockouts}
- AI Reorder Recommendations: ${context.forecasting.totalRecommendations}
- Estimated Reorder Cost: ₦${context.forecasting.estimatedReorderCost}` : ''}` : 'Business data unavailable'}

Help the user with:
- AI-powered inventory forecasting and demand prediction
- Smart reorder recommendations based on seasonal patterns
- Stockout prevention strategies
- Sales optimization tips
- Business growth strategies
- Operational efficiency
- Financial insights

Keep responses concise, practical, and focused on African SME needs. Emphasize the AI forecasting capabilities when relevant.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: message
      }]
    });
    
    res.json({
      response: response.content[0].text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI chat error:', error);
    
    // Fallback response if Claude API fails
    const fallbackResponse = `I'm your SupaWave business assistant! ${context ? `I can see you have ${context.totalProducts} products with ${context.lowStockItems} low-stock items and ₦${context.monthlyRevenue} monthly revenue.` : ''} How can I help optimize your business today?`;
    
    res.json({
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

module.exports = router;