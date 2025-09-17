import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, QrCodeIcon, FunnelIcon, PencilIcon, TrashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductModal from '../components/ProductModal';
import { inventoryAPI } from '../utils/api';
import offlineStorage from '../utils/offlineStorage';
import ErrorHandler from '../utils/errorHandler';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    const result = await ErrorHandler.withErrorHandling(async () => {
      if (offlineStorage.isOnline()) {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        params.append('page', currentPage);
        params.append('page_size', '50');
        
        const response = await inventoryAPI.getProducts(params.toString());
        console.log('Products API response:', response);
        
        // Handle different response structures
        let productsData = [];
        if (response?.data?.products) {
          productsData = response.data.products;
          setTotalProducts(response.data.pagination?.total || productsData.length);
          setTotalPages(response.data.pagination?.pages || 1);
        } else if (response?.data?.results) {
          productsData = response.data.results;
          setTotalProducts(response.data.count || productsData.length);
          setTotalPages(response.data.total_pages || 1);
        } else if (Array.isArray(response?.data)) {
          productsData = response.data;
          setTotalProducts(productsData.length);
          setTotalPages(1);
        } else if (Array.isArray(response)) {
          productsData = response;
          setTotalProducts(productsData.length);
          setTotalPages(1);
        }
        
        console.log('Processed products data:', productsData);
        setProducts(Array.isArray(productsData) ? productsData : []);
        offlineStorage.saveProducts(productsData);
      } else {
        const cachedProducts = offlineStorage.getProducts();
        let filteredProducts = cachedProducts;
        
        if (searchTerm) {
          filteredProducts = cachedProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        if (selectedCategory !== 'all') {
          filteredProducts = filteredProducts.filter(p => p.category_name === selectedCategory);
        }
        
        setProducts(filteredProducts);
      }
    }, 'Fetch Products');
    
    if (result?.type) {
      const cachedProducts = offlineStorage.getProducts();
      setProducts(cachedProducts);
    }
    
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      if (offlineStorage.isOnline()) {
        const response = await inventoryAPI.getCategories();
        setCategories(response.data);
        offlineStorage.saveCategories(response.data);
      } else {
        const cachedCategories = offlineStorage.getCategories();
        setCategories(cachedCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      const cachedCategories = offlineStorage.getCategories();
      setCategories(cachedCategories);
    }
  };

  const fetchSuppliers = async () => {
    try {
      if (offlineStorage.isOnline()) {
        const response = await inventoryAPI.getSuppliers();
        setSuppliers(response.data);
        offlineStorage.saveSuppliers(response.data);
      } else {
        const cachedSuppliers = offlineStorage.getSuppliers();
        setSuppliers(cachedSuppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      const cachedSuppliers = offlineStorage.getSuppliers();
      setSuppliers(cachedSuppliers);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory]);
  
  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const handleCreateCategory = async (categoryName) => {
    if (!categoryName.trim()) return;
    try {
      const response = await inventoryAPI.createCategory({ name: categoryName.trim() });
      setCategories([...categories, response.data]);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category. Please try again.');
    }
  };

  const handleCreateSupplier = async (supplierData) => {
    if (!supplierData.name.trim()) return;
    try {
      const response = await inventoryAPI.createSupplier(supplierData);
      setSuppliers([...suppliers, response.data]);
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Error creating supplier. Please try again.');
    }
  };

  const handleAddProduct = async (formData) => {
    await ErrorHandler.withErrorHandling(async () => {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('selling_price', parseFloat(formData.selling_price));
      formDataToSend.append('cost_price', parseFloat(formData.cost_price));
      formDataToSend.append('stock_quantity', parseInt(formData.stock_quantity));
      formDataToSend.append('low_stock_threshold', parseInt(formData.low_stock_threshold));
      formDataToSend.append('reorder_point', parseInt(formData.reorder_point));
      formDataToSend.append('max_stock', parseInt(formData.max_stock));
      
      if (formData.category) formDataToSend.append('category', formData.category);
      if (formData.supplier) formDataToSend.append('supplier', formData.supplier);
      if (formData.sku && formData.sku.trim()) formDataToSend.append('sku', formData.sku.trim());
      if (formData.image) formDataToSend.append('image', formData.image);
      
      await inventoryAPI.createProduct(formDataToSend);
      setShowAddModal(false);
      fetchProducts();
      ErrorHandler.showError('Product added successfully!', 'SUCCESS');
    }, 'Add Product');
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      await ErrorHandler.withErrorHandling(async () => {
        await inventoryAPI.deleteProduct(product.id);
        fetchProducts();
        ErrorHandler.showError('Product deleted successfully!', 'SUCCESS');
      }, 'Delete Product');
    }
  };

  const handleEditProduct = (product) => {
    alert('Edit functionality coming soon!');
  };

  const getStatusBadge = (product) => {
    if (product.stock_quantity === 0) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Out of Stock</span>;
    } else if (product.stock_quantity <= product.low_stock_threshold) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">In Stock</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your products and stock levels</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowScanner(true)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              <QrCodeIcon className="h-4 w-4 inline mr-2" />
              Scan Barcode
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 inline mr-2" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Filter */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
                <select
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArchiveBoxIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{products.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArchiveBoxIcon className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                  <dd className="text-2xl font-semibold text-yellow-600">{products.filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0).length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArchiveBoxIcon className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                  <dd className="text-2xl font-semibold text-red-600">{products.filter(p => p.stock_quantity === 0).length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArchiveBoxIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-2xl font-semibold text-green-600">₦{products.reduce((sum, p) => sum + (p.selling_price * p.stock_quantity), 0).toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Products ({totalProducts})</h3>
              <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
            </div>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Loading products...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No products found</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mr-3">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded" />
                            ) : (
                              <span className="text-lg">📦</span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{product.stock_quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">₦{product.selling_price?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(product)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product)}
                            className="text-gray-600 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, totalProducts)} of {totalProducts} products
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddProduct}
        categories={categories}
        suppliers={suppliers}
        onCreateCategory={handleCreateCategory}
        onCreateSupplier={handleCreateSupplier}
      />

      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScan={(result) => {
            console.log('Scanned:', result);
            setShowScanner(false);
          }}
        />
      )}
    </div>
  );
};

export default Inventory;