import React, { useState, useEffect } from 'react';
import { PlusIcon, CheckIcon, XMarkIcon, TrashIcon, MagnifyingGlassIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { storesAPI, inventoryAPI } from '../utils/api';

const InventoryTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [stores, setStores] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    from_store: '',
    to_store: '',
    notes: '',
    items: [{ product: '', quantity: '' }]
  });
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [productSearch, setProductSearch] = useState({});
  const [filteredProducts, setFilteredProducts] = useState({});
  const [storeInventory, setStoreInventory] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransfers, setFilteredTransfers] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchTransfers();
    fetchStores();
    fetchProducts();
  }, []);
  
  useEffect(() => {
    if (user?.role === 'owner' && stores.length > 0) {
      const mainStore = stores.find(store => store.is_main_store);
      if (mainStore && !formData.from_store) {
        setFormData(prev => ({...prev, from_store: mainStore.id}));
      }
    }
  }, [stores, user, formData.from_store]);

  const fetchTransfers = async () => {
    try {
      const response = await storesAPI.getTransfers();
      let transfersData;
      if (response.data.results) {
        transfersData = response.data.results;
      } else if (Array.isArray(response.data)) {
        transfersData = response.data;
      } else {
        transfersData = [];
      }
      setTransfers(transfersData);
      setFilteredTransfers(transfersData);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setTransfers([]);
      setFilteredTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await storesAPI.getStores();
      let storesData;
      if (response.data.results) {
        storesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        storesData = response.data;
      } else {
        storesData = [];
      }
      setStores(storesData);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Fetching products...');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/inventory/products/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Products API error:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('Raw products response:', data);
      
      let productsArray = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data.products && Array.isArray(data.products)) {
        productsArray = data.products;
      } else if (data.results && Array.isArray(data.results)) {
        productsArray = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        productsArray = data.data;
      }
      
      console.log('Products array:', productsArray);
      setProducts(productsArray);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchStoreInventory = async (storeId, productName) => {
    try {
      const response = await fetch(`http://localhost:8000/api/stores/${storeId}/inventory/?search=${encodeURIComponent(productName)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      const item = data.results?.find(item => item.product_name === productName);
      return item?.quantity || 0;
    } catch (error) {
      console.error('Error fetching store inventory:', error);
      return 0;
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!formData.from_store || !formData.to_store) {
        alert('Please select both from and to stores');
        return;
      }
      
      const validItems = formData.items.filter(item => item.product && item.quantity && parseInt(item.quantity) > 0);
      console.log('Form items:', formData.items);
      console.log('Valid items:', validItems);
      if (validItems.length === 0) {
        alert('Please add at least one product to transfer');
        return;
      }
      
      const transferData = {
        from_store_id: formData.from_store,
        to_store_id: formData.to_store,
        notes: formData.notes,
        items: validItems.map(item => ({
          product_id: item.product,
          quantity: parseInt(item.quantity),
          unit_cost: 0
        }))
      };
      
      console.log('Sending transfer data:', transferData);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/transfers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transferData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Transfer API error:', errorData);
        throw new Error(errorData.error || 'Failed to create transfer');
      }
      
      setShowCreateModal(false);
      setFormData({ from_store: '', to_store: '', notes: '', items: [{ product: '', quantity: '' }] });
      fetchTransfers();
      alert('Transfer created successfully!');
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert(`Error creating transfer: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const addTransferItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: '' }]
    });
  };

  const removeTransferItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateTransferItem = (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, items: updatedItems });
  };

  const approveTransfer = async (transferId) => {
    setActionLoading(prev => ({...prev, [`approve_${transferId}`]: true}));
    try {
      await storesAPI.approveTransfer(transferId);
      fetchTransfers();
    } catch (error) {
      console.error('Error approving transfer:', error);
      alert('Error approving transfer');
    } finally {
      setActionLoading(prev => ({...prev, [`approve_${transferId}`]: false}));
    }
  };

  const completeTransfer = async (transferId) => {
    setActionLoading(prev => ({...prev, [`complete_${transferId}`]: true}));
    try {
      await storesAPI.completeTransfer(transferId);
      fetchTransfers();
    } catch (error) {
      console.error('Error completing transfer:', error);
      alert('Error completing transfer');
    } finally {
      setActionLoading(prev => ({...prev, [`complete_${transferId}`]: false}));
    }
  };

  const cancelTransfer = async (transferId) => {
    setActionLoading(prev => ({...prev, [`cancel_${transferId}`]: true}));
    try {
      await storesAPI.cancelTransfer(transferId);
      fetchTransfers();
    } catch (error) {
      console.error('Error cancelling transfer:', error);
    } finally {
      setActionLoading(prev => ({...prev, [`cancel_${transferId}`]: false}));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      in_transit: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Transit' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const filtered = transfers.filter(transfer => 
      transfer.id.toLowerCase().includes(term.toLowerCase()) ||
      transfer.from_store_name.toLowerCase().includes(term.toLowerCase()) ||
      transfer.to_store_name.toLowerCase().includes(term.toLowerCase()) ||
      transfer.status.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredTransfers(filtered);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Inventory Transfers</h1>
            <p className="text-gray-600 mt-1">Transfer inventory between stores</p>
          </div>
          {(user?.is_business_owner || user?.role === 'owner') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Transfer
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transfers by ID, store names, or status..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Transfers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transfers</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Store</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Store</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <ArrowsRightLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'No transfers match your search' : 'Create your first transfer to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    #{transfer.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transfer.from_store_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transfer.to_store_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transfer.total_items || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transfer.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transfer.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {transfer.status === 'pending' && (user?.is_business_owner || user?.role === 'owner') && (
                        <>
                          <button
                            onClick={() => approveTransfer(transfer.id)}
                            disabled={actionLoading[`approve_${transfer.id}`]}
                            className="p-2 text-green-600 hover:text-green-900 disabled:opacity-50 rounded-lg hover:bg-green-50 transition-colors"
                            title="Approve"
                          >
                            {actionLoading[`approve_${transfer.id}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b border-green-600"></div>
                            ) : (
                              <CheckIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => cancelTransfer(transfer.id)}
                            disabled={actionLoading[`cancel_${transfer.id}`]}
                            className="p-2 text-red-600 hover:text-red-900 disabled:opacity-50 rounded-lg hover:bg-red-50 transition-colors"
                            title="Cancel"
                          >
                            {actionLoading[`cancel_${transfer.id}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b border-red-600"></div>
                            ) : (
                              <XMarkIcon className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                      {transfer.status === 'in_transit' && (user?.is_business_owner || user?.role === 'owner') && (
                        <>
                          <button
                            onClick={() => completeTransfer(transfer.id)}
                            disabled={actionLoading[`complete_${transfer.id}`]}
                            className="px-3 py-1.5 text-xs text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading[`complete_${transfer.id}`] ? 'Processing...' : 'Complete'}
                          </button>
                          <button
                            onClick={() => cancelTransfer(transfer.id)}
                            disabled={actionLoading[`cancel_${transfer.id}`]}
                            className="p-2 text-red-600 hover:text-red-900 disabled:opacity-50 rounded-lg hover:bg-red-50 transition-colors"
                            title="Cancel"
                          >
                            {actionLoading[`cancel_${transfer.id}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b border-red-600"></div>
                            ) : (
                              <XMarkIcon className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Create Inventory Transfer</h3>
            </div>
            
            <form onSubmit={handleCreateTransfer} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Store</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.from_store}
                    onChange={(e) => setFormData({...formData, from_store: e.target.value})}
                  >
                    <option value="">Select store</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} {store.is_main_store ? '(Main Store)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Store</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.to_store}
                    onChange={(e) => setFormData({...formData, to_store: e.target.value})}
                  >
                    <option value="">Select store</option>
                    {stores.filter(s => s.id !== formData.from_store).map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} {store.is_main_store ? '(Main Store)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optional notes about this transfer..."
                />
              </div>
              
              {/* Transfer Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Products to Transfer</label>
                  <button
                    type="button"
                    onClick={addTransferItem}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Product
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex space-x-2 items-center">
                      <div className="flex-1">
                        <select
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={item.product || ''}
                          onChange={(e) => {
                            updateTransferItem(index, 'product', e.target.value);
                            console.log('Selected product ID:', e.target.value);
                          }}
                        >
                          <option value="">Select product</option>
                          {Array.isArray(products) && products.length > 0 ? products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - ₦{product.selling_price || 0}
                            </option>
                          )) : (
                            <option disabled>No products available</option>
                          )}
                        </select>
                      </div>
                      
                      <input
                        type="number"
                        placeholder="Qty"
                        className="w-20 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={item.quantity}
                        onChange={(e) => updateTransferItem(index, 'quantity', e.target.value)}
                        min="1"
                      />
                      
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTransferItem(index)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTransfers;