import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const StockTake = () => {
  const [stockTakes, setStockTakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStockTakes();
    fetchCategories();
  }, []);

  const fetchStockTakes = async () => {
    try {
      const response = await api.get('/inventory/stock-takes/');
      setStockTakes(response.data || []);
      setError(null);
    } catch (error) {
      setError('Failed to load stock takes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/inventory/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const createStockTake = async (data) => {
    try {
      await api.post('/inventory/stock-takes/', data);
      fetchStockTakes();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating stock take:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in_progress': return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'cancelled': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <p className="text-red-600">{error}</p>
      <button 
        onClick={() => { setError(null); setLoading(true); fetchStockTakes(); }}
        className="mt-2 bg-red-600 text-white px-3 py-1 text-sm hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stock Taking</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Count physical inventory and reconcile with system records</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Create stock take by category or all products</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Scan barcodes or manually count items</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Track variances and update inventory</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Start New Count</span>
          </button>
        </div>
      </div>

      {/* Stock Takes List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-medium">Stock Take History</h2>
        </div>
        
        {stockTakes.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardDocumentListIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stock takes yet</h3>
            <p className="text-gray-500 mb-6">Start your first inventory count to track and reconcile your stock</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700"
            >
              Create First Stock Take
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stockTakes.map((stockTake) => (
              <Link
                key={stockTake.id}
                to={`/stock-take/${stockTake.id}`}
                className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-start sm:items-center space-x-3">
                      {getStatusIcon(stockTake.status)}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{stockTake.name}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                          <span>{stockTake.category_name ? `${stockTake.category_name} Category` : 'All Products'}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Created {new Date(stockTake.created_at).toLocaleDateString()}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>By {stockTake.created_by_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-medium text-gray-900">{getStatusText(stockTake.status)}</span>
                    {stockTake.completed_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completed {new Date(stockTake.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateStockTakeModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onCreate={createStockTake}
        />
      )}
    </div>
  );
};

const CreateStockTakeModal = ({ categories, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-6">Create New Stock Take</h2>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. System captures current inventory quantities</li>
            <li>2. Walk around and count physical stock</li>
            <li>3. Enter actual counts and variance reasons</li>
            <li>4. Complete to update system inventory</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Take Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder={`Stock Count - ${new Date().toLocaleDateString()}`}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Products (Full Inventory)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name} Category Only</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose a category to count specific products, or select all for full inventory count
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={2}
              placeholder="e.g., Monthly count, Post-delivery check, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 hover:bg-blue-700 font-medium"
            >
              Start Counting
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTake;