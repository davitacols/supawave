import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../utils/api';
import { ExclamationTriangleIcon, LightBulbIcon, ArrowTrendingUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SmartAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [reorderSuggestions, setReorderSuggestions] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const [alertsRes, reorderRes] = await Promise.all([
        analyticsAPI.getAdvancedAnalytics(),
        analyticsAPI.getReorderSuggestions()
      ]);
      setAlerts(alertsRes.data.predictive_alerts || []);
      setReorderSuggestions(reorderRes.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'stock_out': return ExclamationTriangleIcon;
      case 'demand_spike': return ArrowTrendingUpIcon;
      default: return LightBulbIcon;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'stock_out': return 'text-red-600 bg-red-50 border-red-200';
      case 'demand_spike': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await analyticsAPI.markAlertRead(alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Predictive Alerts */}
      {alerts.map((alert) => {
        const IconComponent = getAlertIcon(alert.type);
        return (
          <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <IconComponent className="h-5 w-5 mt-0.5 mr-3" />
                <div>
                  <p className="font-medium">{alert.message}</p>
                  {alert.product && (
                    <p className="text-sm opacity-75">Product: {alert.product}</p>
                  )}
                  <p className="text-xs opacity-60">Confidence: {alert.confidence}%</p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="opacity-60 hover:opacity-100"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Smart Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <LightBulbIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h4 className="font-medium text-yellow-800">Smart Reorder Suggestions</h4>
          </div>
          <div className="space-y-2">
            {reorderSuggestions.slice(0, 3).map((suggestion, index) => (
              <div key={index} className="text-sm text-yellow-700">
                <span className="font-medium">{suggestion.product_name}</span>
                {' - '}Order {suggestion.suggested_quantity} units 
                (Current: {suggestion.current_stock})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAlerts;