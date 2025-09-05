import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowTrendingUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DemandForecast = () => {
  const [forecasts, setForecasts] = useState([
    {
      product: 'Coca-Cola 50cl',
      currentStock: 25,
      predictedDemand: 45,
      confidence: 87,
      daysUntilStockout: 3,
      suggestedOrder: 60,
      trend: 'increasing'
    },
    {
      product: 'Indomie Noodles',
      currentStock: 80,
      predictedDemand: 30,
      confidence: 92,
      daysUntilStockout: 12,
      suggestedOrder: 0,
      trend: 'stable'
    }
  ]);

  const chartData = [
    { day: 'Mon', actual: 12, predicted: 15 },
    { day: 'Tue', actual: 8, predicted: 10 },
    { day: 'Wed', actual: 15, predicted: 18 },
    { day: 'Thu', actual: null, predicted: 22 },
    { day: 'Fri', actual: null, predicted: 28 },
    { day: 'Sat', actual: null, predicted: 35 },
    { day: 'Sun', actual: null, predicted: 20 }
  ];

  const getStatusColor = (days) => {
    if (days <= 3) return 'danger';
    if (days <= 7) return 'warning';
    return 'success';
  };

  const getStatusIcon = (days) => {
    if (days <= 3) return ExclamationTriangleIcon;
    if (days <= 7) return ArrowTrendingUpIcon;
    return CheckCircleIcon;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
          AI Demand Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Weekly Trend Chart */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">7-Day Sales Prediction</h4>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis hide />
              <ReferenceLine x="Wed" stroke="#e5e7eb" strokeDasharray="2 2" />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 text-xs mt-2">
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-blue-500 mr-1"></div>
              Actual
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-green-500 border-dashed mr-1"></div>
              Predicted
            </div>
          </div>
        </div>

        {/* Product Forecasts */}
        <div className="space-y-3">
          {forecasts.map((forecast, index) => {
            const StatusIcon = getStatusIcon(forecast.daysUntilStockout);
            return (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{forecast.product}</div>
                    <div className="text-xs text-gray-500">
                      Stock: {forecast.currentStock} | Predicted: {forecast.predictedDemand}/week
                    </div>
                  </div>
                  <Badge variant={getStatusColor(forecast.daysUntilStockout)} className="flex items-center">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {forecast.daysUntilStockout}d
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">
                    Confidence: {forecast.confidence}%
                  </span>
                  {forecast.suggestedOrder > 0 && (
                    <span className="text-blue-600 font-medium">
                      Order: {forecast.suggestedOrder} units
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Insights */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-1">💡 AI Insights</div>
          <div className="text-xs text-blue-600">
            • Weekend sales typically increase by 40%<br/>
            • Rainy season boosts beverage sales by 25%<br/>
            • Payday week (end of month) shows 60% spike
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemandForecast;