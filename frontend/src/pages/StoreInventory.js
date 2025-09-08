import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { storesAPI, inventoryAPI } from '../utils/api';

const StoreInventory = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageLoading, setPageLoading] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    quantity: ''
  });

  useEffect(() => {
    console.log('StoreInventory component mounted, storeId:', storeId);
    if (storeId) {
      fetchStoreInventory(1);
      fetchProducts();
    } else {
      setError('No store ID provided');
      setLoading(false);
    }
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStoreInventory = async (page = 1, search = '') => {
    setPageLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
        ...(search && { search })
      });
      
      const response = await fetch(`http://localhost:8000/api/stores/${storeId}/inventory/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setInventory(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(data.total_pages || 1);
      setCurrentPage(data.page || 1);
      
      if (page === 1) {
        const storesResponse = await storesAPI.getStores();
        const storesData = storesResponse.data || [];
        const currentStore = storesData.find(s => s.id === storeId);
        setStore(currentStore);
      }
      
    } catch (error) {
      setError(error.message);
      setInventory([]);
    } finally {
      setLoading(false);
      setPageLoading(false);
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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await storesAPI.addProductToStore(storeId, formData);
      setShowAddModal(false);
      setFormData({ product: '', quantity: '' });
      fetchStoreInventory();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error: {error}</p>
        <p className="text-gray-500">Store ID: {storeId}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Inventory</h1>
          <p className="text-gray-600">{store?.name || 'Loading store...'}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-sky-500 text-white px-4 py-2 hover:bg-sky-600"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 shadow">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-4 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              const delayedSearch = setTimeout(() => {
                setCurrentPage(1);
                fetchStoreInventory(1, e.target.value);
              }, 300);
              return () => clearTimeout(delayedSearch);
            }}
          />
        </div>
      </div>


      {/* Inventory Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No products in this store</p>
          <p className="text-sm text-gray-400 mb-4">Add products to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600"
          >
            Add First Product
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reserved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product_name || item.product?.name || 'Unknown Product'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.reserved_quantity || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.available_quantity || (item.quantity - (item.reserved_quantity || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₦{item.selling_price || item.product?.selling_price || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Product to Store</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-sky-500"
                  value={formData.product}
                  onChange={(e) => setFormData({...formData, product: e.target.value})}
                >
                  <option value="">Select product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-sky-500"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 text-white py-2 rounded hover:bg-sky-600"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-4 shadow rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} products
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchStoreInventory(currentPage - 1, searchTerm)}
                disabled={currentPage === 1 || pageLoading}
                className="px-3 py-2 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
              >
                {pageLoading && currentPage > 1 && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-600"></div>
                )}
                <span>Previous</span>
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => fetchStoreInventory(currentPage + 1, searchTerm)}
                disabled={currentPage === totalPages || pageLoading}
                className="px-3 py-2 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
              >
                {pageLoading && currentPage < totalPages && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-600"></div>
                )}
                <span>Next</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreInventory;