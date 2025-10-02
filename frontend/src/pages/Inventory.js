import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, QrCodeIcon, FunnelIcon, PencilIcon, TrashIcon, ArchiveBoxIcon, ExclamationTriangleIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductModal from '../components/ProductModal';
import DemandForecast from '../components/DemandForecast';
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
  const [stockFilter, setStockFilter] = useState('all');
  const [pageSize, setPageSize] = useState(50);

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
        if (stockFilter === 'low') params.append('low_stock', 'true');
        params.append('page', currentPage.toString());
        params.append('limit', pageSize.toString());
        
        console.log('🔍 Fetching products with params:', params.toString());
        const response = await inventoryAPI.getProducts(params.toString());
        console.log('📦 Products response:', response);
        
        let productsData = [];
        if (response?.data?.products) {
          productsData = response.data.products;
          setTotalProducts(response.data.pagination?.total || 0);
          setTotalPages(response.data.pagination?.pages || 1);
          console.log('📊 Pagination info:', response.data.pagination);
        } else if (Array.isArray(response?.data)) {
          productsData = response.data;
          setTotalProducts(productsData.length);
          setTotalPages(1);
        }
        
        console.log('📦 Setting products:', productsData.length, 'items');
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
        
        if (stockFilter === 'low') {
          filteredProducts = filteredProducts.filter(p => 
            parseInt(p.stock_quantity) <= parseInt(p.low_stock_threshold)
          );
        } else if (stockFilter === 'out') {
          filteredProducts = filteredProducts.filter(p => parseInt(p.stock_quantity) === 0);
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
  }, [searchTerm, selectedCategory, stockFilter]);
  
  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize]);

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

  // Calculate stats from current products
  const stats = {
    total: products.length,
    lowStock: products.filter(p => parseInt(p.stock_quantity) <= parseInt(p.low_stock_threshold) && parseInt(p.stock_quantity) > 0).length,
    outOfStock: products.filter(p => parseInt(p.stock_quantity) === 0).length,
    totalValue: products.reduce((sum, p) => sum + (parseFloat(p.selling_price || 0) * parseInt(p.stock_quantity || 0)), 0)
  };

  const getStatusBadge = (product) => {
    const stock = parseInt(product.stock_quantity);
    const threshold = parseInt(product.low_stock_threshold);
    
    if (stock === 0) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Out of Stock</span>;
    } else if (stock <= threshold) {
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
            <h1 className="text-2xl font-medium text-gray-900 flex items-center">
              Inventory Management
              <CpuChipIcon className="h-6 w-6 ml-2 text-blue-600" />
            </h1>
            <p className="text-sm text-gray-600 mt-1">AI-powered inventory tracking and forecasting</p>
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
        {/* AI Forecasting Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-1">
            <DemandForecast />
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArchiveBoxIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                    <dd className="text-3xl font-bold text-gray-900">{stats.total}</dd>
                    <dd className="text-sm text-gray-600">₦{stats.totalValue.toLocaleString()} value</dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Alert</dt>
                    <dd className="text-3xl font-bold text-yellow-600">{stats.lowStock}</dd>
                    <dd className="text-sm text-gray-600">Need reordering</dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArchiveBoxIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                    <dd className="text-3xl font-bold text-red-600">{stats.outOfStock}</dd>
                    <dd className="text-sm text-gray-600">Immediate action</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, SKU, or barcode..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock Only</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Products ({totalProducts})</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
                {stats.lowStock > 0 && (
                  <div className="flex items-center text-yellow-600">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">{stats.lowStock} need attention</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        Loading products...
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <ArchiveBoxIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No products found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stock = parseInt(product.stock_quantity);
                    const threshold = parseInt(product.low_stock_threshold);
                    const isLowStock = stock <= threshold && stock > 0;
                    const isOutOfStock = stock === 0;
                    
                    return (
                      <tr key={product.id} className={`hover:bg-gray-50 ${isOutOfStock ? 'bg-red-50' : isLowStock ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <span className="text-xl">📦</span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-500">ID: {product.id?.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.sku || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category_name || 'Uncategorized'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{stock}</div>
                          <div className="text-xs text-gray-500">Threshold: {threshold}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₦{parseFloat(product.selling_price || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(product)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalProducts)} of {totalProducts} products
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm border-t border-b border-gray-300 hover:bg-gray-50 ${
                          currentPage === pageNum 
                            ? 'bg-blue-50 text-blue-600 border-blue-300' 
                            : 'text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
              
              {/* Page Size Selector */}
              <div className="mt-4 flex items-center justify-center">
                <label className="text-sm text-gray-700 mr-2">Items per page:</label>
                <select 
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
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