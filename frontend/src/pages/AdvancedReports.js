import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  DocumentChartBarIcon, CalendarIcon, ArrowDownTrayIcon, PrinterIcon,
  CurrencyDollarIcon, ArchiveBoxIcon, ReceiptPercentIcon, ChartBarIcon
} from '@heroicons/react/24/outline';
import { financeAPI } from '../utils/api';

const AdvancedReports = () => {
  const [activeTab, setActiveTab] = useState('profit-loss');
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      let response;
      
      switch(activeTab) {
        case 'profit-loss':
          response = await financeAPI.getProfitLoss(`start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`);
          break;
        case 'sales':
          response = await financeAPI.getSalesReport(`start_date=${dateRange.start_date}&end_date=${dateRange.end_date}&group_by=day`);
          break;
        case 'inventory':
          response = await financeAPI.getInventoryReport();
          break;
        case 'tax':
          response = await financeAPI.getTaxReport(`start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`);
          break;
        default:
          return;
      }
      
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₦${parseFloat(amount || 0).toLocaleString()}`;

  const exportToPDF = () => {
    window.print();
  };

  const exportToCSV = () => {
    // Simple CSV export implementation
    let csvContent = '';
    
    if (activeTab === 'profit-loss' && reportData) {
      csvContent = 'Category,Amount\n';
      csvContent += `Gross Revenue,${reportData.revenue.gross_revenue}\n`;
      csvContent += `Total Expenses,${reportData.expenses.total_expenses}\n`;
      csvContent += `Net Profit,${reportData.profit.net_profit}\n`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-report.csv`;
    a.click();
  };

  const tabs = [
    { id: 'profit-loss', name: 'Profit & Loss', icon: CurrencyDollarIcon },
    { id: 'sales', name: 'Sales Report', icon: ChartBarIcon },
    { id: 'inventory', name: 'Inventory Report', icon: ArchiveBoxIcon },
    { id: 'tax', name: 'Tax Report', icon: ReceiptPercentIcon }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DocumentChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                Advanced Reports
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive business analytics and reporting</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={exportToPDF}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center text-sm"
                >
                  <PrinterIcon className="h-4 w-4 mr-1" />
                  PDF
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Report Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading report...</p>
              </div>
            ) : (
              <>
                {/* Profit & Loss Report */}
                {activeTab === 'profit-loss' && reportData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.revenue?.gross_revenue)}</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-red-800">Total Expenses</h3>
                        <p className="text-2xl font-bold text-red-900">{formatCurrency(reportData.expenses?.total_expenses)}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800">Net Profit</h3>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.profit?.net_profit)}</p>
                        <p className="text-sm text-blue-600">{reportData.profit?.profit_margin?.toFixed(1) || 0}% margin</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
                        <div className="space-y-2">
                          {reportData.expenses?.by_category?.map((expense, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm">{expense.category}</span>
                              <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Revenue Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">Total Sales</span>
                            <span className="font-semibold">{reportData.revenue?.total_sales || 0}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">Tax Collected</span>
                            <span className="font-semibold">{formatCurrency(reportData.revenue?.total_tax)}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">Discounts Given</span>
                            <span className="font-semibold">{formatCurrency(reportData.revenue?.total_discounts)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sales Report */}
                {activeTab === 'sales' && reportData && (
                  <div className="space-y-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.sales_trend || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Top Products</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Times Sold</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {reportData.top_products?.map((product, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{product.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{product.total_quantity}</td>
                                <td className="px-4 py-2 text-sm font-semibold text-gray-900">{formatCurrency(product.total_revenue)}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{product.times_sold}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inventory Report */}
                {activeTab === 'inventory' && reportData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800">Total Products</h3>
                        <p className="text-2xl font-bold text-blue-900">{reportData.valuation?.total_products || 0}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-800">Inventory Value</h3>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.valuation?.total_cost_value)}</p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-yellow-800">Low Stock Items</h3>
                        <p className="text-2xl font-bold text-yellow-900">{reportData.valuation?.low_stock_items || 0}</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-red-800">Out of Stock</h3>
                        <p className="text-2xl font-bold text-red-900">{reportData.valuation?.out_of_stock_items || 0}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
                        <div className="space-y-2">
                          {reportData.category_breakdown?.map((category, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm">{category.category}</span>
                              <div className="text-right">
                                <div className="font-semibold">{formatCurrency(category.cost_value)}</div>
                                <div className="text-xs text-gray-500">{category.product_count} products</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Low Stock Alert</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {reportData.low_stock_products?.map((product, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                              <span className="text-sm">{product.name}</span>
                              <div className="text-right">
                                <div className="font-semibold text-red-600">{product.stock_quantity} left</div>
                                <div className="text-xs text-gray-500">Min: {product.low_stock_threshold}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tax Report */}
                {activeTab === 'tax' && reportData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800">Tax Collected</h3>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.summary?.total_tax_collected)}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-800">Taxable Revenue</h3>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.summary?.taxable_revenue)}</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-purple-800">Taxable Transactions</h3>
                        <p className="text-2xl font-bold text-purple-900">{reportData.summary?.taxable_transactions || 0}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Monthly Tax Breakdown</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reportData.monthly_breakdown || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Bar dataKey="tax_collected" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;