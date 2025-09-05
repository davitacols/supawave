import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { analyticsAPI } from '../utils/api';

const LiveMetrics = () => {
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    activeCustomers: 0,
    avgOrderValue: 0,
    conversionRate: 0
  });

  const fetchLiveMetrics = async () => {
    try {
      const response = await analyticsAPI.getLiveMetrics();
      setMetrics({
        todaySales: response.data.today_sales,
        activeCustomers: response.data.active_customers,
        avgOrderValue: response.data.avg_order_value,
        conversionRate: response.data.conversion_rate
      });
    } catch (error) {
      console.error('Error fetching live metrics:', error);
    }
  };

  useEffect(() => {
    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Live Metrics</h3>
          <Badge variant="success" className="animate-pulse">● Live</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.todaySales}</div>
            <div className="text-xs text-blue-500">Today's Sales</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{metrics.activeCustomers}</div>
            <div className="text-xs text-green-500">Active Customers</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">₦{Math.round(metrics.avgOrderValue).toLocaleString()}</div>
            <div className="text-xs text-purple-500">Avg Order Value</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{metrics.conversionRate}%</div>
            <div className="text-xs text-orange-500">Conversion Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMetrics;