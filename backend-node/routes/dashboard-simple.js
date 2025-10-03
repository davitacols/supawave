const express = require('express');
const router = express.Router();

// Simple dashboard stats without dependencies
router.get('/stats', (req, res) => {
  res.json({
    todayStats: { sales: 5, revenue: 125000, customers: 8, orders: 5 },
    weeklyStats: { sales: 32, revenue: 890000, customers: 45, orders: 32 },
    monthlyStats: { sales: 156, revenue: 3250000, customers: 189, orders: 156 },
    inventory: { totalProducts: 1247, lowStock: 23, outOfStock: 5, categories: 18 },
    recentSales: [],
    topProducts: [],
    salesTrend: [],
    alerts: [{ type: 'success', message: 'Dashboard loaded successfully', timestamp: new Date().toISOString() }]
  });
});

router.get('/test', (req, res) => {
  res.json({ message: 'Simple dashboard route working', timestamp: new Date().toISOString() });
});

module.exports = router;