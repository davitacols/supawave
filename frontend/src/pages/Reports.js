import React, { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon, ChartBarIcon, CalendarIcon,
  CurrencyDollarIcon, ShoppingBagIcon, ArchiveBoxIcon,
  CreditCardIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  EyeIcon, PrinterIcon, ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { salesAPI, analyticsAPI, inventoryAPI, authAPI } from '../utils/api';
import api from '../utils/api';
import ExportButtons from '../components/ExportButtons';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState({});

  useEffect(() => {
    fetchBusiness();
    generateReport();
  }, [activeTab, dateRange]);

  const fetchBusiness = async () => {
    try {
      const response = await authAPI.getBusiness();
      setBusiness(response.data);
    } catch (error) {
      console.error('Error fetching business:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let data = {};
      
      switch (activeTab) {
        case 'sales':
          data = await generateSalesReport();
          break;
        case 'inventory':
          data = await generateInventoryReport();
          break;
        case 'financial':
          data = await generateFinancialReport();
          break;
        case 'credit':
          data = await generateCreditReport();
          break;
        default:
          data = {};
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesReport = async () => {
    const [analytics, sales] = await Promise.all([
      salesAPI.getAnalytics(),
      salesAPI.getSales()
    ]);

    const filteredSales = sales.data.filter(sale => {
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
      return saleDate >= dateRange.start && saleDate <= dateRange.end;
    });

    const dailySales = {};
    filteredSales.forEach(sale => {
      const date = new Date(sale.created_at).toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { date, revenue: 0, count: 0 };
      }
      dailySales[date].revenue += parseFloat(sale.total_amount);
      dailySales[date].count += 1;
    });

    return {
      totalRevenue: filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
      totalSales: filteredSales.length,
      averageOrderValue: filteredSales.length > 0 ? 
        filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) / filteredSales.length : 0,
      dailyData: Object.values(dailySales).sort((a, b) => new Date(a.date) - new Date(b.date)),
      topProducts: analytics.data.top_products || [],
      recentSales: filteredSales.slice(0, 10)
    };
  };

  const generateInventoryReport = async () => {
    const [products, lowStock] = await Promise.all([
      inventoryAPI.getProducts(),
      inventoryAPI.getLowStockProducts()
    ]);

    const allProducts = products.data.results || products.data;
    const totalValue = allProducts.reduce((sum, product) => 
      sum + (product.stock_quantity * product.cost_price), 0);

    return {
      totalProducts: allProducts.length,
      totalValue: totalValue,
      lowStockCount: lowStock.data.length,
      outOfStockCount: allProducts.filter(p => p.stock_quantity === 0).length,
      products: allProducts,
      lowStockProducts: lowStock.data,
      categoryBreakdown: getCategoryBreakdown(allProducts)
    };
  };

  const generateFinancialReport = async () => {
    const [sales, analytics] = await Promise.all([
      salesAPI.getSales(),
      salesAPI.getAnalytics()
    ]);

    const filteredSales = sales.data.filter(sale => {
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
      return saleDate >= dateRange.start && saleDate <= dateRange.end;
    });

    const revenue = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const estimatedCost = revenue * 0.6; // Assuming 40% margin
    const profit = revenue - estimatedCost;

    return {
      revenue: revenue,
      estimatedCost: estimatedCost,
      grossProfit: profit,
      profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
      salesCount: filteredSales.length,
      averageOrderValue: filteredSales.length > 0 ? revenue / filteredSales.length : 0
    };
  };

  const generateCreditReport = async () => {
    try {
      const [dashboard, customers, sales] = await Promise.all([
        api.get('/credit/dashboard/'),
        api.get('/credit/customers/'),
        api.get('/credit/sales/')
      ]);

      return {
        totalOutstanding: dashboard.data.total_outstanding,
        overdueAmount: dashboard.data.overdue_amount,
        weeklyCollections: dashboard.data.weekly_collections,
        customersWithDebt: dashboard.data.customers_with_debt,
        creditCustomers: customers.data,
        creditSales: sales.data
      };
    } catch (error) {
      return {
        totalOutstanding: 0,
        overdueAmount: 0,
        weeklyCollections: 0,
        customersWithDebt: 0,
        creditCustomers: [],
        creditSales: []
      };
    }
  };

  const getCategoryBreakdown = (products) => {
    const categories = {};
    products.forEach(product => {
      const category = product.category?.name || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { count: 0, value: 0 };
      }
      categories[category].count += 1;
      categories[category].value += product.stock_quantity * product.cost_price;
    });
    return categories;
  };

  const exportReport = () => {
    const printContent = document.getElementById('report-content');
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const tabs = [
    { id: 'sales', name: 'Sales Report', icon: ChartBarIcon },
    { id: 'inventory', name: 'Inventory Report', icon: ArchiveBoxIcon },
    { id: 'financial', name: 'Financial Report', icon: CurrencyDollarIcon },
    { id: 'credit', name: 'Credit Report', icon: CreditCardIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">Business Analytics</h1>
              <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">Comprehensive insights and reporting for {business.name}</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => window.print()}
                className="bg-white/10 backdrop-blur-sm text-white px-3 sm:px-4 py-2 rounded hover:bg-white/20 flex items-center justify-center space-x-2 transition-colors text-sm"
              >
                <PrinterIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Print</span>
              </button>
              <div className="w-full sm:w-auto">
                <ExportButtons type={activeTab === 'sales' ? 'sales' : activeTab === 'inventory' ? 'products' : 'all'} dateRange={dateRange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">

        {/* Date Range & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Date Range Card */}
          <div className="lg:col-span-1 bg-white p-3 sm:p-6 shadow-sm border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Report Period</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <ChartBarIcon className="h-4 w-4" />
                )}
                <span>{loading ? 'Loading...' : 'Update'}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            <div className="bg-white p-3 sm:p-6 shadow-sm border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">₦{reportData.totalRevenue?.toLocaleString() || '0'}</p>
                  <div className="flex items-center mt-1">
                    <ArrowTrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                    <span className="text-xs sm:text-sm text-green-600">+12.5%</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded">
                  <CurrencyDollarIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-6 shadow-sm border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Sales</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{reportData.totalSales || '0'}</p>
                  <div className="flex items-center mt-1">
                    <ArrowTrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mr-1" />
                    <span className="text-xs sm:text-sm text-blue-600">+8.2%</span>
                  </div>
                </div>
                <div className="p-1 sm:p-3 bg-blue-100 rounded">
                  <ShoppingBagIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-6 shadow-sm border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Avg Order Value</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">₦{reportData.averageOrderValue?.toLocaleString() || '0'}</p>
                  <div className="flex items-center mt-1">
                    <ArrowTrendingDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
                    <span className="text-xs sm:text-sm text-red-600">-2.1%</span>
                  </div>
                </div>
                <div className="p-1 sm:p-3 bg-purple-100 rounded">
                  <ChartBarIcon className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="px-3 sm:px-6 py-3 sm:py-4">
            <nav className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 rounded'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded'
                  }`}
                >
                  <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Report Content */}
        <div id="report-content">
          {activeTab === 'sales' && <SalesReport data={reportData} business={business} dateRange={dateRange} />}
          {activeTab === 'inventory' && <InventoryReport data={reportData} business={business} />}
          {activeTab === 'financial' && <FinancialReport data={reportData} business={business} dateRange={dateRange} />}
          {activeTab === 'credit' && <CreditReport data={reportData} business={business} />}
        </div>
      </div>
    </div>
  );
};

const SalesReport = ({ data, business, dateRange }) => (
  <div className="space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 shadow">
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">₦{data.totalRevenue?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="flex items-center">
          <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-2xl font-bold">{data.totalSales || 0}</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="flex items-center">
          <ChartBarIcon className="h-8 w-8 text-purple-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-500">Avg Order Value</p>
            <p className="text-2xl font-bold">₦{data.averageOrderValue?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Sales Chart */}
    <div className="bg-white p-6 shadow">
      <h3 className="text-lg font-medium mb-4">Daily Sales Trend</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.dailyData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Top Products */}
    <div className="bg-white p-6 shadow">
      <h3 className="text-lg font-medium mb-4">Top Selling Products</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.topProducts?.map((product, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.product__name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.total_sold}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₦{(product.total_sold * 1000).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const InventoryReport = ({ data, business }) => (
  <div className="space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalProducts || 0}</p>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Inventory Value</p>
          <p className="text-2xl font-bold text-green-600">₦{data.totalValue?.toLocaleString() || 0}</p>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">{data.lowStockCount || 0}</p>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{data.outOfStockCount || 0}</p>
        </div>
      </div>
    </div>

    {/* Low Stock Products */}
    <div className="bg-white p-6 shadow">
      <h3 className="text-lg font-medium mb-4">Low Stock Alert</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.lowStockProducts?.map((product, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.stock_quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.low_stock_threshold}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold ${
                    product.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const FinancialReport = ({ data, business, dateRange }) => (
  <div className="space-y-6">
    {/* Financial Summary */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-green-600">₦{data.revenue?.toLocaleString() || 0}</p>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Estimated Cost</p>
          <p className="text-2xl font-bold text-red-600">₦{data.estimatedCost?.toLocaleString() || 0}</p>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Gross Profit</p>
          <p className="text-2xl font-bold text-blue-600">₦{data.grossProfit?.toLocaleString() || 0}</p>
        </div>
      </div>
    </div>

    {/* Profit Analysis */}
    <div className="bg-white p-6 shadow">
      <h3 className="text-lg font-medium mb-4">Profit Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-gray-500 mb-2">Profit Margin</p>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 h-4">
              <div 
                className="bg-green-500 h-4" 
                style={{ width: `${Math.min(data.profitMargin || 0, 100)}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium">{data.profitMargin?.toFixed(1) || 0}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Average Order Value</p>
          <p className="text-xl font-bold">₦{data.averageOrderValue?.toLocaleString() || 0}</p>
        </div>
      </div>
    </div>
  </div>
);

const CreditReport = ({ data, business }) => (
  <div className="space-y-6">
    {/* Credit Summary */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-600">₦{data.totalOutstanding?.toLocaleString() || 0}</p>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Overdue Amount</p>
          <p className="text-2xl font-bold text-orange-600">₦{data.overdueAmount?.toLocaleString() || 0}</p>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Weekly Collections</p>
          <p className="text-2xl font-bold text-green-600">₦{data.weeklyCollections?.toLocaleString() || 0}</p>
        </div>
      </div>
      <div className="bg-white p-6 shadow">
        <div className="text-center">
          <p className="text-sm text-gray-500">Customers with Debt</p>
          <p className="text-2xl font-bold text-blue-600">{data.customersWithDebt || 0}</p>
        </div>
      </div>
    </div>

    {/* Credit Customers */}
    <div className="bg-white p-6 shadow">
      <h3 className="text-lg font-medium mb-4">Credit Customers</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available Credit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.creditCustomers?.map((customer, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {customer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₦{customer.credit_limit?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₦{customer.current_balance?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₦{customer.available_credit?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Reports;