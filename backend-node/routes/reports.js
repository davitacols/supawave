const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get daily report
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    // Sales summary
    const salesResult = await pool.query(
      `SELECT 
         COUNT(*) as total_sales,
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(AVG(total_amount), 0) as average_sale
       FROM sales_sale 
       WHERE business_id = $1::bigint 
       AND DATE(created_at) = $2`,
      [req.user.business_id, reportDate]
    );
    
    // Return empty top products for now since sales_saleitem structure needs verification
    const productsResult = { rows: [] };
    
    res.json({
      date: reportDate,
      summary: salesResult.rows[0],
      top_products: productsResult.rows
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// Get monthly report
router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const reportMonth = month || (currentDate.getMonth() + 1);
    const reportYear = year || currentDate.getFullYear();
    
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_sales,
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(AVG(total_amount), 0) as average_sale,
         DATE_TRUNC('day', created_at) as sale_date,
         COUNT(*) as daily_sales
       FROM sales_sale 
       WHERE business_id = $1::bigint 
       AND EXTRACT(MONTH FROM created_at) = $2
       AND EXTRACT(YEAR FROM created_at) = $3
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY sale_date`,
      [req.user.business_id, reportMonth, reportYear]
    );
    
    res.json({
      month: reportMonth,
      year: reportYear,
      daily_breakdown: result.rows
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// Get yearly report
router.get('/yearly', authenticateToken, async (req, res) => {
  try {
    const { year } = req.query;
    const reportYear = year || new Date().getFullYear();
    
    const result = await pool.query(
      `SELECT 
         EXTRACT(MONTH FROM created_at) as month,
         COUNT(*) as total_sales,
         COALESCE(SUM(total_amount), 0) as total_revenue
       FROM sales_sale 
       WHERE business_id = $1::bigint 
       AND EXTRACT(YEAR FROM created_at) = $2
       GROUP BY EXTRACT(MONTH FROM created_at)
       ORDER BY month`,
      [req.user.business_id, reportYear]
    );
    
    res.json({
      year: reportYear,
      monthly_breakdown: result.rows
    });
  } catch (error) {
    console.error('Yearly report error:', error);
    res.status(500).json({ error: 'Failed to generate yearly report' });
  }
});

module.exports = router;