import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ShoppingCartIcon, CheckCircleIcon, ClockIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { inventoryAPI } from '../utils/api';

const SmartReorder = () => {
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [alertsRes, recommendationsRes] = await Promise.all([
        inventoryAPI.getAlerts(),
        inventoryAPI.getSmartReorder()
      ]);
      
      const ordersRes = { data: [] }; // Placeholder for purchase orders
      
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
      setRecommendations(Array.isArray(recommendationsRes.data?.recommendations) ? recommendationsRes.data.recommendations : Array.isArray(recommendationsRes.data) ? recommendationsRes.data : []);
      setPurchaseOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAlerts([]);
      setRecommendations([]);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async () => {
    try {
      setLoading(true);
      await fetchData();
    } catch (error) {
      console.error('Error generating alerts:', error);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      setAlerts(prev => Array.isArray(prev) ? prev.filter(alert => alert.id !== alertId) : []);
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const createPurchaseOrder = async (supplierId, alertIds) => {
    try {
      alert('Purchase order feature coming soon!');
    } catch (error) {
      console.error('Error creating purchase order:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-gray-900">Smart Reorder System</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CpuChipIcon className="h-3 w-3 mr-1" />
                ML-Powered
              </span>
            </div>
            <p className="text-gray-600 mt-1">AI-powered demand forecasting and predictive inventory management</p>
          </div>
          <button 
            onClick={generateAlerts}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Generate Alerts
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'alerts', name: 'Alerts', count: alerts.length },
              { id: 'recommendations', name: 'Recommendations', count: recommendations.length },
              { id: 'orders', name: 'Purchase Orders', count: purchaseOrders.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-gray-600">Your inventory levels look good!</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                        {alert.priority.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{alert.product_name}</span>
                    </div>
                    <p className="text-gray-900 mb-2">{alert.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Current Stock: {alert.current_stock}</span>
                      {alert.suggested_order_quantity && (
                        <span>Suggested Order: {alert.suggested_order_quantity}</span>
                      )}
                      {alert.days_until_stockout && (
                        <span>Days Left: {alert.days_until_stockout}</span>
                      )}
                      {alert.predicted_daily_demand && (
                        <span>Daily Demand: {alert.predicted_daily_demand}</span>
                      )}
                      {alert.forecast_confidence && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          AI: {alert.forecast_confidence}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {recommendations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ML Recommendations</h3>
              <p className="text-gray-600">Need more sales history for AI predictions</p>
            </div>
          ) : (
            recommendations.map((rec, index) => (
              <div key={rec.product_id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900">{rec.product_name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Current Stock: {rec.current_stock} • Daily Demand: {rec.predicted_daily_demand}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">₦{rec.estimated_cost?.toLocaleString()}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      AI: {rec.confidence}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Days Until Stockout</p>
                    <p className="font-medium text-lg">{rec.days_until_stockout?.toFixed(1)} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Suggested Order</p>
                    <p className="font-medium text-lg">{rec.suggested_order_quantity} units</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <ShoppingCartIcon className="h-4 w-4 mr-2" />
                    Create Order
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {purchaseOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders</h3>
              <p className="text-gray-600">Create orders from recommendations</p>
            </div>
          ) : (
            purchaseOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{order.po_number}</h3>
                    <p className="text-sm text-gray-600">{order.supplier_name}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                    <span className="font-medium">₦{order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Items: {order.items.length}</p>
                  <p>Created: {new Date(order.created_at).toLocaleDateString()}</p>
                  {order.is_auto_generated && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                      Auto-Generated
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SmartReorder;