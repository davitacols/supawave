import React, { useState, useEffect } from 'react';
import { DocumentArrowDownIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReport();
  }, [activeTab, selectedDate, selectedMonth, selectedYear]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/reports/${activeTab}/`;
      let params = new URLSearchParams();
      
      if (activeTab === 'daily') {
        params.append('date', selectedDate);
      } else if (activeTab === 'monthly') {
        params.append('month', selectedMonth);
        params.append('year', selectedYear);
      } else if (activeTab === 'yearly') {
        params.append('year', selectedYear);
      }
      
      const response = await api.get(`${url}?${params}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      let url = `/reports/export/${activeTab}/`;
      let params = new URLSearchParams();
      
      if (activeTab === 'daily') {
        params.append('date', selectedDate);
      } else if (activeTab === 'monthly') {
        params.append('month', selectedMonth);
        params.append('year', selectedYear);
      } else if (activeTab === 'yearly') {
        params.append('year', selectedYear);
      }
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${activeTab}_report.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert('Failed to export CSV');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Business Reports</h1>
          <p className="text-gray-600">Detailed sales and transaction reports</p>
        </div>
        <Button onClick={exportCSV} className="flex items-center space-x-2">
          <DocumentArrowDownIcon className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'daily', name: 'Daily Report' },
            { id: 'monthly', name: 'Monthly Report' },
            { id: 'yearly', name: 'Yearly Report' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Date/Period Selectors */}
      <div className="flex items-center space-x-4">
        {activeTab === 'daily' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        
        {activeTab === 'monthly' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={2024 - i} value={2024 - i}>
                    {2024 - i}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        
        {activeTab === 'yearly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={2024 - i} value={2024 - i}>
                  {2024 - i}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(reportData.total_sales)}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {reportData.total_transactions}
                  </p>
                </div>
              </div>
            </Card>
            
            {reportData.items_sold && (
              <Card className="p-6">
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Items Sold</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {reportData.items_sold}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Daily Report Details */}
          {activeTab === 'daily' && reportData.sales_list && (
            <div className="space-y-4">
              {reportData.sales_list.map((sale) => (
                <Card key={sale.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Sale #{sale.id}</h3>
                      <p className="text-sm text-gray-600">{sale.time} - {sale.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(sale.total)}</p>
                      <p className="text-sm text-gray-600">{sale.items} items</p>
                    </div>
                  </div>
                  
                  {sale.items_detail && sale.items_detail.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Items Sold:</h4>
                      <div className="space-y-2">
                        {sale.items_detail.map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <div>
                              <span className="font-medium">{item.product}</span>
                              <span className="text-gray-600 ml-2">x{item.quantity}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(item.total_price)}</div>
                              <div className="text-sm text-gray-600">{formatCurrency(item.unit_price)}/unit</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Monthly Report Breakdown */}
          {activeTab === 'monthly' && reportData.daily_breakdown && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.daily_breakdown.map((day) => (
                      <tr key={day.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.transactions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(day.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Yearly Report Breakdown */}
          {activeTab === 'yearly' && reportData.monthly_breakdown && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthly_breakdown.map((month) => (
                      <tr key={month.month}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.month_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.transactions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(month.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;