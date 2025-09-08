import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ShoppingCartIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

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
      const [alertsRes, recommendationsRes, ordersRes] = await Promise.all([
        api.get('/inventory/alerts/'),
        api.get('/inventory/alerts/recommendations/'),
        api.get('/inventory/purchase-orders/')
      ]);
      
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
      setRecommendations(Array.isArray(recommendationsRes.data) ? recommendationsRes.data : []);
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
      await api.post('/inventory/alerts/generate_alerts/');
      fetchData();
    } catch (error) {
      console.error('Error generating alerts:', error);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await api.post(`/inventory/alerts/${alertId}/dismiss/`);
      setAlerts(prev => Array.isArray(prev) ? prev.filter(alert => alert.id !== alertId) : []);
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const createPurchaseOrder = async (supplierId, alertIds) => {
    try {
      await api.post('/inventory/purchase-orders/create_from_alerts/', {
        supplier_id: supplierId,
        alert_ids: alertIds
      });
      fetchData();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Smart Reorder System</h1>
          <p className="text-gray-600">AI-powered inventory management and predictive alerts</p>
        </div>
        <Button onClick={generateAlerts} className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>Generate Alerts</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'alerts', name: 'Alerts', count: alerts.length },
            { id: 'recommendations', name: 'Recommendations', count: recommendations.length },
            { id: 'orders', name: 'Purchase Orders', count: purchaseOrders.length }
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
              {tab.count > 0 && (
                <Badge className="ml-2">{tab.count}</Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-gray-600">Your inventory levels look good!</p>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-500">{alert.product_name}</span>
                    </div>
                    <p className="text-gray-900 mb-2">{alert.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Current Stock: {alert.current_stock}</span>
                      {alert.suggested_order_quantity && (
                        <span>Suggested Order: {alert.suggested_order_quantity}</span>
                      )}
                      {alert.predicted_stockout_date && (
                        <span>Stockout Date: {new Date(alert.predicted_stockout_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {recommendations.length === 0 ? (
            <Card className="text-center py-12">
              <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations</h3>
              <p className="text-gray-600">Generate alerts to see reorder recommendations</p>
            </Card>
          ) : (
            recommendations.map((rec) => (
              <Card key={rec.supplier.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{rec.supplier.name}</h3>
                    <p className="text-sm text-gray-600">
                      {rec.products.length} products • Total: ₦{rec.total_cost.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => createPurchaseOrder(
                      rec.supplier.id,
                      rec.products.map(p => p.alert_id)
                    )}
                    className="flex items-center space-x-2"
                  >
                    <ShoppingCartIcon className="h-4 w-4" />
                    <span>Create Order</span>
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {rec.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{product.product.name}</p>
                        <p className="text-sm text-gray-600">
                          Stock: {product.current_stock} • 
                          {product.days_until_stockout && ` ${product.days_until_stockout} days left`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Qty: {product.suggested_quantity}</p>
                        <p className="text-sm text-gray-600">₦{product.estimated_cost.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {purchaseOrders.length === 0 ? (
            <Card className="text-center py-12">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders</h3>
              <p className="text-gray-600">Create orders from recommendations</p>
            </Card>
          ) : (
            purchaseOrders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{order.po_number}</h3>
                    <p className="text-sm text-gray-600">{order.supplier_name}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                    <span className="font-medium">₦{order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Items: {order.items.length}</p>
                  <p>Created: {new Date(order.created_at).toLocaleDateString()}</p>
                  {order.is_auto_generated && (
                    <Badge className="mt-2 bg-blue-100 text-blue-800">Auto-Generated</Badge>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SmartReorder;