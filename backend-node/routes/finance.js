const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Get financial dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.business_id;
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    // Revenue (from sales)
    const revenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE(created_at) = $2 THEN total_amount END), 0) as today_revenue,
        COALESCE(SUM(CASE WHEN DATE(created_at) >= $3 THEN total_amount END), 0) as month_revenue
      FROM sales_sale WHERE business_id = $1
    `, [businessId, today, monthStart]);
    
    // Expenses
    const expenseResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN expense_date = $2 THEN amount END), 0) as today_expenses,
        COALESCE(SUM(CASE WHEN expense_date >= $3 THEN amount END), 0) as month_expenses
      FROM finance_expense WHERE business_id = $1
    `, [businessId, today, monthStart]);
    
    // Profit calculation
    const revenue = revenueResult.rows[0];
    const expenses = expenseResult.rows[0];
    
    const todayProfit = parseFloat(revenue.today_revenue) - parseFloat(expenses.today_expenses);
    const monthProfit = parseFloat(revenue.month_revenue) - parseFloat(expenses.month_expenses);
    
    // Top expense categories this month
    const topExpenses = await pool.query(`
      SELECT ec.name, SUM(e.amount) as total
      FROM finance_expense e
      JOIN finance_expensecategory ec ON e.category_id = ec.id
      WHERE e.business_id = $1 AND e.expense_date >= $2
      GROUP BY ec.id, ec.name
      ORDER BY total DESC LIMIT 5
    `, [businessId, monthStart]);
    
    // Cash flow trend (last 7 days) - simplified approach
    const cashFlowResult = await pool.query(`
      WITH date_range AS (
        SELECT DISTINCT DATE(created_at) as date
        FROM sales_sale 
        WHERE business_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 days'
        UNION
        SELECT DISTINCT expense_date as date
        FROM finance_expense 
        WHERE business_id = $1 AND expense_date >= CURRENT_DATE - INTERVAL '6 days'
      ),
      revenue_data AS (
        SELECT DATE(created_at) as date, SUM(total_amount) as amount
        FROM sales_sale 
        WHERE business_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(created_at)
      ),
      expense_data AS (
        SELECT expense_date as date, SUM(amount) as amount
        FROM finance_expense 
        WHERE business_id = $1 AND expense_date >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY expense_date
      )
      SELECT 
        dr.date,
        COALESCE(r.amount, 0) as revenue,
        COALESCE(e.amount, 0) as expenses,
        COALESCE(r.amount, 0) - COALESCE(e.amount, 0) as net_flow
      FROM date_range dr
      LEFT JOIN revenue_data r ON dr.date = r.date
      LEFT JOIN expense_data e ON dr.date = e.date
      ORDER BY dr.date
    `, [businessId]);
    
    res.json({
      summary: {
        today_revenue: parseFloat(revenue.today_revenue),
        today_expenses: parseFloat(expenses.today_expenses),
        today_profit: todayProfit,
        month_revenue: parseFloat(revenue.month_revenue),
        month_expenses: parseFloat(expenses.month_expenses),
        month_profit: monthProfit
      },
      top_expenses: topExpenses.rows,
      cash_flow: cashFlowResult.rows
    });
  } catch (error) {
    console.error('Financial dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch financial dashboard' });
  }
});

// Get all expenses
router.get('/expenses', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT e.*, ec.name as category_name
      FROM finance_expense e
      LEFT JOIN finance_expensecategory ec ON e.category_id = ec.id
      WHERE e.business_id = $1
    `;
    const params = [req.user.business_id];
    
    if (category) {
      query += ` AND e.category_id = $${params.length + 1}`;
      params.push(category);
    }
    
    if (start_date) {
      query += ` AND e.expense_date >= $${params.length + 1}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND e.expense_date <= $${params.length + 1}`;
      params.push(end_date);
    }
    
    query += ` ORDER BY e.expense_date DESC, e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM finance_expense WHERE business_id = $1`;
    const countParams = [req.user.business_id];
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      expenses: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create expense
router.post('/expenses', authenticateToken, async (req, res) => {
  try {
    const { category_id, amount, description, expense_date, payment_method, receipt_number, vendor_name } = req.body;
    
    const result = await pool.query(`
      INSERT INTO finance_expense (business_id, category_id, amount, description, expense_date, payment_method, receipt_number, vendor_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.business_id, category_id, amount, description, expense_date, payment_method || 'cash', receipt_number, vendor_name]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get expense categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM finance_expensecategory 
      WHERE business_id = $1 OR business_id = 1
      ORDER BY name
    `, [req.user.business_id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get profit/loss report
router.get('/profit-loss', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const businessId = req.user.business_id;
    
    // Revenue breakdown
    const revenueResult = await pool.query(`
      SELECT 
        COUNT(*) as total_sales,
        SUM(total_amount) as gross_revenue,
        SUM(subtotal) as net_revenue,
        SUM(tax_amount) as total_tax,
        SUM(discount) as total_discounts
      FROM sales_sale 
      WHERE business_id = $1 
      AND ($2::date IS NULL OR DATE(created_at) >= $2)
      AND ($3::date IS NULL OR DATE(created_at) <= $3)
    `, [businessId, start_date, end_date]);
    
    // Expense breakdown by category
    const expenseResult = await pool.query(`
      SELECT 
        ec.name as category,
        SUM(e.amount) as amount,
        COUNT(e.id) as count
      FROM finance_expense e
      JOIN finance_expensecategory ec ON e.category_id = ec.id
      WHERE e.business_id = $1
      AND ($2::date IS NULL OR e.expense_date >= $2)
      AND ($3::date IS NULL OR e.expense_date <= $3)
      GROUP BY ec.id, ec.name
      ORDER BY amount DESC
    `, [businessId, start_date, end_date]);
    
    const revenue = revenueResult.rows[0];
    const expenses = expenseResult.rows;
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    res.json({
      period: { start_date, end_date },
      revenue: {
        gross_revenue: parseFloat(revenue.gross_revenue || 0),
        net_revenue: parseFloat(revenue.net_revenue || 0),
        total_sales: parseInt(revenue.total_sales || 0),
        total_tax: parseFloat(revenue.total_tax || 0),
        total_discounts: parseFloat(revenue.total_discounts || 0)
      },
      expenses: {
        total_expenses: totalExpenses,
        by_category: expenses
      },
      profit: {
        gross_profit: parseFloat(revenue.gross_revenue || 0) - totalExpenses,
        net_profit: parseFloat(revenue.net_revenue || 0) - totalExpenses,
        profit_margin: revenue.net_revenue ? ((parseFloat(revenue.net_revenue) - totalExpenses) / parseFloat(revenue.net_revenue) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Profit/loss report error:', error);
    res.status(500).json({ error: 'Failed to generate profit/loss report' });
  }
});

// Get sales report
router.get('/sales-report', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;
    const businessId = req.user.business_id;
    
    let dateFormat, dateInterval;
    switch(group_by) {
      case 'month': dateFormat = 'YYYY-MM'; dateInterval = '1 month'; break;
      case 'week': dateFormat = 'YYYY-"W"WW'; dateInterval = '1 week'; break;
      default: dateFormat = 'YYYY-MM-DD'; dateInterval = '1 day';
    }
    
    const salesTrend = await pool.query(`
      SELECT 
        TO_CHAR(created_at, $4) as period,
        COUNT(*) as total_sales,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_sale_value
      FROM sales_sale 
      WHERE business_id = $1
      AND ($2::date IS NULL OR DATE(created_at) >= $2)
      AND ($3::date IS NULL OR DATE(created_at) <= $3)
      GROUP BY TO_CHAR(created_at, $4)
      ORDER BY period
    `, [businessId, start_date, end_date, dateFormat]);
    
    // Top products
    const topProducts = await pool.query(`
      SELECT 
        p.name,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_revenue,
        COUNT(DISTINCT si.sale_id) as times_sold
      FROM sales_saleitem si
      JOIN inventory_product p ON si.product_id = p.id
      JOIN sales_sale s ON si.sale_id = s.id
      WHERE s.business_id = $1
      AND ($2::date IS NULL OR DATE(s.created_at) >= $2)
      AND ($3::date IS NULL OR DATE(s.created_at) <= $3)
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [businessId, start_date, end_date]);
    
    res.json({
      period: { start_date, end_date, group_by },
      sales_trend: salesTrend.rows,
      top_products: topProducts.rows
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

// Get inventory report
router.get('/inventory-report', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.business_id;
    
    // Inventory valuation
    const valuationResult = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(stock_quantity * cost_price) as total_cost_value,
        SUM(stock_quantity * selling_price) as total_selling_value,
        COUNT(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_items
      FROM inventory_product 
      WHERE business_id = $1 AND is_active = true
    `, [businessId]);
    
    // Category breakdown
    const categoryBreakdown = await pool.query(`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as category,
        COUNT(p.id) as product_count,
        SUM(p.stock_quantity * p.cost_price) as cost_value,
        SUM(p.stock_quantity * p.selling_price) as selling_value
      FROM inventory_product p
      LEFT JOIN inventory_category c ON p.category_id = c.id
      WHERE p.business_id = $1 AND p.is_active = true
      GROUP BY c.id, c.name
      ORDER BY cost_value DESC
    `, [businessId]);
    
    // Low stock products
    const lowStockProducts = await pool.query(`
      SELECT name, stock_quantity, low_stock_threshold, selling_price
      FROM inventory_product
      WHERE business_id = $1 AND stock_quantity <= low_stock_threshold AND is_active = true
      ORDER BY stock_quantity ASC
      LIMIT 20
    `, [businessId]);
    
    res.json({
      valuation: valuationResult.rows[0],
      category_breakdown: categoryBreakdown.rows,
      low_stock_products: lowStockProducts.rows
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ error: 'Failed to generate inventory report' });
  }
});

// Get tax report
router.get('/tax-report', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const businessId = req.user.business_id;
    
    // Tax summary
    const taxSummary = await pool.query(`
      SELECT 
        SUM(tax_amount) as total_tax_collected,
        SUM(subtotal) as taxable_revenue,
        COUNT(*) as taxable_transactions
      FROM sales_sale
      WHERE business_id = $1 AND tax_amount > 0
      AND ($2::date IS NULL OR DATE(created_at) >= $2)
      AND ($3::date IS NULL OR DATE(created_at) <= $3)
    `, [businessId, start_date, end_date]);
    
    // Monthly tax breakdown
    const monthlyTax = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(tax_amount) as tax_collected,
        SUM(subtotal) as taxable_revenue
      FROM sales_sale
      WHERE business_id = $1 AND tax_amount > 0
      AND ($2::date IS NULL OR DATE(created_at) >= $2)
      AND ($3::date IS NULL OR DATE(created_at) <= $3)
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `, [businessId, start_date, end_date]);
    
    res.json({
      period: { start_date, end_date },
      summary: taxSummary.rows[0],
      monthly_breakdown: monthlyTax.rows
    });
  } catch (error) {
    console.error('Tax report error:', error);
    res.status(500).json({ error: 'Failed to generate tax report' });
  }
});

module.exports = router;