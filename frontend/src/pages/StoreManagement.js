import React, { useState, useEffect } from 'react';
import { PlusIcon, BuildingStorefrontIcon, ChartBarIcon, ArrowRightIcon, ArrowsRightLeftIcon, UserIcon } from '@heroicons/react/24/outline';
import InventoryTransfer from '../components/InventoryTransfer';
import ManagerAssignment from '../components/ManagerAssignment';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    phone: '',
    manager_name: '',
    is_main_store: false
  });

  useEffect(() => {
    fetchStores();
    fetchTransfers();
  }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/stores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Store API error:', response.status, response.statusText);
        return;
      }
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        setStores([]);
        return;
      }
      
      try {
        const data = JSON.parse(text);
        setStores(Array.isArray(data) ? data : []);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text.substring(0, 100));
        setStores([]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    }
  };

  const fetchTransfers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/stores/transfers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Transfers API error:', response.status);
        return;
      }
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        setTransfers([]);
        return;
      }
      
      try {
        const data = JSON.parse(text);
        setTransfers(Array.isArray(data) ? data : []);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text.substring(0, 100));
        setTransfers([]);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setTransfers([]);
    }
  };

  const createStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStore)
      });

      if (response.ok) {
        await fetchStores();
        // Refresh store context
        if (window.refreshStores) {
          window.refreshStores();
        }
        setShowCreateForm(false);
        setNewStore({ name: '', address: '', phone: '', manager_name: '', is_main_store: false });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create store');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BuildingStorefrontIcon className="h-8 w-8 text-blue-600 mr-3" />
              Store Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your stores and branches</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowTransferForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
              Transfer
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Store
            </button>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stores.map((store) => (
            <StoreCard 
              key={store.id} 
              store={store} 
              onAssignManager={(store) => {
                setSelectedStore(store);
                setShowManagerModal(true);
              }}
            />
          ))}
        </div>

        {/* Recent Transfers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <ArrowRightIcon className="h-5 w-5 text-gray-500 mr-2" />
              Recent Transfers
            </h2>
          </div>
          <div className="p-6">
            {transfers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transfers yet</p>
            ) : (
              <div className="space-y-4">
                {transfers.slice(0, 5).map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{transfer.product_name}</div>
                      <div className="text-sm text-gray-500">
                        {transfer.from_store_name} → {transfer.to_store_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{transfer.quantity} units</div>
                      <div className="text-xs text-gray-500">{transfer.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transfer Modal */}
        {showTransferForm && (
          <InventoryTransfer 
            onClose={() => {
              setShowTransferForm(false);
              fetchTransfers();
            }} 
          />
        )}

        {/* Manager Assignment Modal */}
        {showManagerModal && (
          <ManagerAssignment
            store={selectedStore}
            onUpdate={fetchStores}
            onClose={() => {
              setShowManagerModal(false);
              setSelectedStore(null);
            }}
          />
        )}

        {/* Create Store Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Store</h3>
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={createStore} className="space-y-4">
                <input
                  type="text"
                  placeholder="Store Name"
                  value={newStore.name}
                  onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <textarea
                  placeholder="Address"
                  value={newStore.address}
                  onChange={(e) => setNewStore({...newStore, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newStore.phone}
                  onChange={(e) => setNewStore({...newStore, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Manager Name"
                  value={newStore.manager_name}
                  onChange={(e) => setNewStore({...newStore, manager_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newStore.is_main_store}
                    onChange={(e) => setNewStore({...newStore, is_main_store: e.target.checked})}
                    className="mr-2"
                  />
                  Main Store
                </label>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Store'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setError('');
                    }}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StoreCard = ({ store, onAssignManager }) => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [store.id]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/stores/${store.id}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{store.name}</h3>
        {store.is_main_store && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Main</span>
        )}
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {store.address && <p>{store.address}</p>}
        {store.phone && <p>{store.phone}</p>}
        <div className="flex items-center justify-between">
          <p>Manager: {store.manager_first_name ? 
            `${store.manager_first_name} ${store.manager_last_name}` : 
            store.manager_name || 'Not assigned'
          }</p>
          <button
            onClick={() => onAssignManager(store)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Assign Manager"
          >
            <UserIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {analytics && analytics.sales && analytics.inventory && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              ₦{parseInt(analytics.sales.total_revenue || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {analytics.inventory.total_products || 0}
            </div>
            <div className="text-xs text-gray-500">Products</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagement;