import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const AdvancedReports = () => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('7d');
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    generateReport();
  }, [reportType, dateRange]);

  const generateReport = () => {
    // Mock data generation
    const data = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      sales: Math.floor(Math.random() * 50000) + 10000,
      profit: Math.floor(Math.random() * 15000) + 3000,
      items: Math.floor(Math.random() * 100) + 20
    }));
    setReportData(data);
  };

  const exportReport = () => {
    const csv = [
      ['Date', 'Sales', 'Profit', 'Items Sold'],
      ...reportData.map(row => [row.date, row.sales, row.profit, row.items])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${dateRange}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advanced Reports</h2>
        <Button onClick={exportReport}>
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex space-x-4">
        <select 
          value={reportType} 
          onChange={(e) => setReportType(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="sales">Sales Report</option>
          <option value="inventory">Inventory Report</option>
          <option value="profit">Profit Analysis</option>
        </select>
        
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="profit" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                ₦{reportData.reduce((sum, item) => sum + item.sales, 0).toLocaleString()}
              </p>
              <p className="text-gray-600">Total Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ₦{reportData.reduce((sum, item) => sum + item.profit, 0).toLocaleString()}
              </p>
              <p className="text-gray-600">Total Profit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {reportData.reduce((sum, item) => sum + item.items, 0)}
              </p>
              <p className="text-gray-600">Items Sold</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedReports;