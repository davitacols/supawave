import React, { useState, useEffect } from 'react';
import { PlusIcon, CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
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
    console.log('User data:', userData); // Debug log
    setUser(userData);
    fetchTransfers();
    fetchStores();
    fetchProducts();
  }, []);
  
  useEffect(() => {
    // Auto-select main store as 'from' store for owners
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
      // Handle both paginated and direct array responses
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
      console.log('Fetched stores:', storesData);
      // Debug: Check if main store exists
      const mainStore = storesData.find(s => s.is_main_store);
      console.log('Main store found:', mainStore);
      setStores(storesData);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await inventoryAPI.getProducts('page_size=100');
      setProducts(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
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
      // Validate required fields
      if (!formData.from_store || !formData.to_store) {
        alert('Please select both from and to stores');
        return;
      }
      
      const validItems = formData.items.filter(item => item.product && item.quantity);
      if (validItems.length === 0) {
        alert('Please add at least one product to transfer');
        return;
      }
      
      const transferData = {
        ...formData,
        items: validItems
      };
      console.log('Creating transfer with data:', transferData);
      
      const response = await storesAPI.createTransfer(transferData);
      console.log('Transfer created successfully:', response);
      
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

  const addTransferItemHandler = () => {
    addTransferItem();
    // Clear search for new item
    const newIndex = formData.items.length;
    setProductSearch({...productSearch, [newIndex]: ''});
    setFilteredProducts({...filteredProducts, [newIndex]: []});
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
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Transfers</h1>
          <p className="text-gray-600">Transfer inventory between stores</p>
        </div>
        {(user?.is_business_owner || user?.role === 'owner') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-sky-500 text-white px-4 py-2 hover:bg-sky-600"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Transfer</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 shadow rounded-lg">
        <div className="relative">
          <input
            type="text"
            placeholder="Search transfers by ID, store names, or status..."
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            value={searchTerm}
            onChange={(e) => {
              const term = e.target.value.toLowerCase();
              setSearchTerm(term);
              const filtered = transfers.filter(transfer => 
                transfer.id.toLowerCase().includes(term) ||
                transfer.from_store_name.toLowerCase().includes(term) ||
                transfer.to_store_name.toLowerCase().includes(term) ||
                transfer.status.toLowerCase().includes(term)
              );
              setFilteredTransfers(filtered);
            }}
          />
        </div>
      </div>

      {/* Transfers List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transfers</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Transfer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  From Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  To Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading transfers...
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No transfers match your search' : 'No transfers found'}
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
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
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
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
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
                            className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 border border-blue-300 disabled:opacity-50 flex items-center space-x-1"
                          >
                            {actionLoading[`complete_${transfer.id}`] && (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                            )}
                            <span>{actionLoading[`complete_${transfer.id}`] ? 'Processing...' : 'Complete'}</span>
                          </button>
                          <button
                            onClick={() => cancelTransfer(transfer.id)}
                            disabled={actionLoading[`cancel_${transfer.id}`]}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Inventory Transfer</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Store
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-sky-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Store
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-sky-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-sky-500"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optional notes about this transfer..."
                />
              </div>
              
              {/* Transfer Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Products to Transfer
                  </label>
                  <button
                    type="button"
                    onClick={addTransferItemHandler}
                    className="text-sky-600 hover:text-sky-800 text-sm"
                  >
                    + Add Product
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex space-x-2 items-center">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search and select product..."
                          className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-sky-500"
                          value={productSearch[index] || ''}
                          onChange={async (e) => {
                            const search = e.target.value;
                            setProductSearch({...productSearch, [index]: search});
                            
                            const filtered = products.filter(p => 
                              p.name.toLowerCase().includes(search.toLowerCase())
                            ); // Show all matching products
                            
                            setFilteredProducts({...filteredProducts, [index]: filtered});
                            
                            // Pre-load inventory for filtered products
                            if (formData.from_store && formData.to_store && filtered.length > 0) {
                              const inventoryPromises = filtered.map(async (product) => {
                                const fromQty = await fetchStoreInventory(formData.from_store, product.name);
                                const toQty = await fetchStoreInventory(formData.to_store, product.name);
                                return {
                                  [`${formData.from_store}_${product.id}`]: fromQty,
                                  [`${formData.to_store}_${product.id}`]: toQty
                                };
                              });
                              
                              const inventoryResults = await Promise.all(inventoryPromises);
                              const newInventory = inventoryResults.reduce((acc, curr) => ({...acc, ...curr}), {});
                              setStoreInventory(prev => ({...prev, ...newInventory}));
                            }
                          }}
                          onFocus={() => {
                            if (!filteredProducts[index]) {
                              setFilteredProducts({...filteredProducts, [index]: products}); // Show all products
                            }
                          }}
                        />
                        
                        {/* Dropdown */}
                        {filteredProducts[index] && filteredProducts[index].length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto shadow-lg">
                            {filteredProducts[index].map(product => {
                              const fromStoreQty = storeInventory[`${formData.from_store}_${product.id}`] || 0;
                              const toStoreQty = storeInventory[`${formData.to_store}_${product.id}`] || 0;
                              
                              return (
                                <div
                                  key={product.id}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                  onClick={async () => {
                                    updateTransferItem(index, 'product', product.id);
                                    setProductSearch({...productSearch, [index]: product.name});
                                    setFilteredProducts({...filteredProducts, [index]: []});
                                    
                                    // Fetch inventory for both stores
                                    if (formData.from_store && formData.to_store) {
                                      const fromQty = await fetchStoreInventory(formData.from_store, product.name);
                                      const toQty = await fetchStoreInventory(formData.to_store, product.name);
                                      setStoreInventory(prev => ({
                                        ...prev,
                                        [`${formData.from_store}_${product.id}`]: fromQty,
                                        [`${formData.to_store}_${product.id}`]: toQty
                                      }));
                                    }
                                  }}
                                >
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <span className="mr-3">Price: ₦{product.selling_price}</span>
                                    {formData.from_store && (
                                      <span className={`mr-3 ${fromStoreQty <= 10 ? 'text-red-600 font-medium' : 'text-blue-600'}`}>
                                        From: {fromStoreQty} units {fromStoreQty <= 10 && '⚠️'}
                                      </span>
                                    )}
                                    {formData.to_store && (
                                      <span className="text-green-600">To: {toStoreQty} units</span>
                                    )}
                                  </div>
                                  {fromStoreQty <= 10 && fromStoreQty > 0 && (
                                    <div className="text-xs text-red-600 mt-1 font-medium">
                                      ⚠️ Low stock in sender store!
                                    </div>
                                  )}
                                  {fromStoreQty === 0 && (
                                    <div className="text-xs text-red-600 mt-1 font-medium">
                                      ❌ Out of stock in sender store!
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="number"
                        placeholder="Qty"
                        className="w-20 border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-sky-500"
                        value={item.quantity}
                        onChange={(e) => updateTransferItem(index, 'quantity', e.target.value)}
                        min="1"
                      />
                      
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTransferItem(index)}
                          className="text-red-600 hover:text-red-800"
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
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTransfer}
                  disabled={submitting}
                  className="flex-1 bg-sky-500 text-white py-2 hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{submitting ? 'Creating...' : 'Create Transfer'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTransfers;