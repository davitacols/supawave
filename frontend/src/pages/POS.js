import React, { useState, useEffect } from 'react';
import { inventoryAPI, salesAPI, authAPI } from '../utils/api';
import { 
  PlusIcon, MinusIcon, TrashIcon, MagnifyingGlassIcon, 
  ShoppingCartIcon, CreditCardIcon, ChevronLeftIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';
import Receipt from '../components/Receipt';
import BarcodeScanner from '../components/BarcodeScanner';
import MobilePOS from './MobilePOS';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import offlineStorage from '../utils/offlineStorage';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cartCollapsed, setCartCollapsed] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [business, setBusiness] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const productsPerPage = 12;
  
  const shortcutsList = [
    { key: 'F1-F12', description: 'Add product to cart' },
    { key: 'Enter', description: 'Complete sale' },
    { key: 'Esc', description: 'Clear cart' },
    { key: 'S', description: 'Open scanner' },
    { key: 'C', description: 'Clear cart' },
    { key: '← →', description: 'Navigate pages' },
    { key: '?', description: 'Show shortcuts' }
  ];

  useEffect(() => {
    fetchProducts();
    fetchBusiness();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [search, currentPage]);

  const fetchBusiness = async () => {
    try {
      const response = await authAPI.getBusiness();
      setBusiness(response.data);
    } catch (error) {
      console.error('Error fetching business:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      
      let allProducts = [];
      
      if (offlineStorage.isOnline()) {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const response = await inventoryAPI.getProducts(params.toString());
        allProducts = response.data.results || response.data;
        offlineStorage.saveProducts(allProducts);
      } else {
        allProducts = offlineStorage.getProducts();
        
        if (search) {
          allProducts = allProducts.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
          );
        }
      }
      
      const availableProducts = allProducts.filter(p => p.stock_quantity > 0);
      
      // Client-side pagination
      const startIndex = (currentPage - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      const paginatedProducts = availableProducts.slice(startIndex, endIndex);
      
      setProducts(paginatedProducts);
      setTotalPages(Math.ceil(availableProducts.length / productsPerPage));
    } catch (error) {
      console.error('Error fetching products:', error);
      const cachedProducts = offlineStorage.getProducts().filter(p => p.stock_quantity > 0);
      setProducts(cachedProducts.slice(0, productsPerPage));
    } finally {
      setProductsLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, unit_price: product.selling_price }]);
    }
  };

  const handleBarcodeSearch = async (barcodeValue) => {
    if (!barcodeValue.trim()) return;
    
    try {
      const response = await inventoryAPI.searchByBarcode(barcodeValue);
      if (response.data && response.data.length > 0) {
        const product = response.data[0];
        if (product.stock_quantity > 0) {
          addToCart(product);
          setBarcode('');
        } else {
          alert('Product is out of stock');
        }
      } else {
        alert('Product not found');
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
      alert('Error searching for product');
    }
  };

  const handleBarcodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSearch(barcode);
    }
  };

  const handleScanResult = (result) => {
    if (result) {
      setBarcode(result);
      handleBarcodeSearch(result);
      setShowScanner(false);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const saleData = {
        total_amount: getTotalAmount().toFixed(2),
        items: cart.map(item => ({
          product: item.product.id,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price).toFixed(2)
        }))
      };
      
      let saleWithItems;
      
      if (offlineStorage.isOnline()) {
        const response = await salesAPI.createSale(saleData);
        saleWithItems = {
          ...response.data,
          items: cart.map(item => ({
            ...item,
            product: item.product
          }))
        };
      } else {
        // Save sale offline for later sync
        offlineStorage.savePendingSale(saleData);
        
        saleWithItems = {
          id: `offline_${Date.now()}`,
          total_amount: getTotalAmount(),
          created_at: new Date().toISOString(),
          offline: true,
          items: cart.map(item => ({
            ...item,
            product: item.product
          }))
        };
        
        // Update stock locally
        cart.forEach(item => {
          const newStock = item.product.stock_quantity - item.quantity;
          offlineStorage.updateProductStock(item.product.id, newStock);
        });
      }
      
      setLastSale(saleWithItems);
      setCart([]);
      fetchProducts();
      setShowReceipt(true);
    } catch (error) {
      alert('Error processing sale');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Keyboard shortcuts - defined after functions
  const shortcuts = {
    'f1': () => products[0] && addToCart(products[0]),
    'f2': () => products[1] && addToCart(products[1]),
    'f3': () => products[2] && addToCart(products[2]),
    'f4': () => products[3] && addToCart(products[3]),
    'f5': () => products[4] && addToCart(products[4]),
    'f6': () => products[5] && addToCart(products[5]),
    'f7': () => products[6] && addToCart(products[6]),
    'f8': () => products[7] && addToCart(products[7]),
    'f9': () => products[8] && addToCart(products[8]),
    'f10': () => products[9] && addToCart(products[9]),
    'f11': () => products[10] && addToCart(products[10]),
    'f12': () => products[11] && addToCart(products[11]),
    'enter': handleCheckout,
    'escape': () => setCart([]),
    's': () => setShowScanner(true),
    'c': () => setCart([]),
    '?': () => setShowShortcutsHelp(!showShortcutsHelp),
    'arrowleft': () => currentPage > 1 && handlePageChange(currentPage - 1),
    'arrowright': () => currentPage < totalPages && handlePageChange(currentPage + 1)
  };
  
  useKeyboardShortcuts(shortcuts);

  // Render mobile version for small screens
  if (isMobile) {
    return (
      <MobilePOS />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-sky-500  flex items-center justify-center">
                  <ShoppingCartIcon className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Barcode Scanner */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h5m0 0v5m0 0h5m0 0V4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Scan or enter barcode..."
                    className="pl-10 pr-12 py-2 w-64 border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyPress={handleBarcodeKeyPress}
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => setShowScanner(true)}
                  className="bg-sky-600 text-white px-3 py-2 hover:bg-sky-700 flex items-center space-x-2"
                  title="Open Camera Scanner"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>
              
              {/* Product Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-sky-50 px-3 py-2">
                  <span className="text-sm font-medium text-sky-700">
                    Cart: {cart.length} items
                  </span>
                </div>
                <button
                  onClick={() => setShowShortcutsHelp(true)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                  title="Keyboard Shortcuts (Press ?)"
                >
                  ⌨️ Shortcuts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
          cartCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-4'
        }`}>
          {/* Products Section */}
          <div className={cartCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <div className="bg-white  shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Available Products</h2>
                  <span className="text-sm text-gray-500">
                    {products.length} products available
                  </span>
                </div>
              </div>
              
              {productsLoading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin  h-12 w-12 border-b-2 border-sky-500"></div>
                </div>
              ) : (
                <>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {products.map((product, index) => (
                        <div
                          key={product.id}
                          className="group relative bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                        >
                          {/* Keyboard shortcut indicator */}
                          {index < 12 && (
                            <div className="absolute top-2 left-2 z-10">
                              <span className="bg-sky-500 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                                F{index + 1}
                              </span>
                            </div>
                          )}
                          {/* Product Image/Icon */}
                          <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-200 transition-colors">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-4xl text-blue-400 group-hover:text-blue-500 transition-colors">
                                📦
                              </div>
                            )}
                            
                            {/* Stock Badge */}
                            <div className="absolute top-2 right-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                product.stock_quantity > 10 
                                  ? 'bg-green-100 text-green-800'
                                  : product.stock_quantity > 0
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.stock_quantity}
                              </span>
                            </div>
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-4">
                            <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                              {product.name}
                            </h3>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-blue-600">
                                  ₦{product.selling_price?.toLocaleString()}
                                </span>
                                {product.cost_price && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₦{product.cost_price?.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              
                              {product.sku && (
                                <p className="text-xs text-gray-500 font-mono">
                                  SKU: {product.sku}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Add to Cart Button */}
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock_quantity === 0}
                            className="absolute inset-0 w-full h-full bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed"
                          >
                            <div className="bg-blue-600 text-white px-4 py-2 font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-gray-300  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 border  ${
                                  currentPage === page
                                    ? 'bg-sky-500 text-white border-sky-500'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-gray-300  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="bg-white  shadow-sm border h-fit sticky top-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
                <span className="bg-sky-100 text-sky-800 text-xs font-medium px-2 py-1 ">
                  {cart.length}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <p className="text-sm text-gray-400">Add products to get started</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="bg-gray-50  p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 mb-1">
                              {item.product.name}
                            </h4>
                            <p className="text-sky-600 font-semibold">
                              ₦{item.unit_price?.toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => updateQuantity(item.product.id, 0)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 bg-white border border-gray-300  flex items-center justify-center hover:bg-gray-50"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 bg-white border border-gray-300  flex items-center justify-center hover:bg-gray-50"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              ₦{(item.quantity * item.unit_price).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-sky-600">
                        ₦{getTotalAmount().toLocaleString()}
                      </span>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full bg-sky-500 text-white py-3 px-4  hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="animate-spin  h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CreditCardIcon className="h-5 w-5" />
                          <span>Complete Sale</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Receipt Modal */}
      {showReceipt && (
        <Receipt
          sale={lastSale}
          business={business}
          onClose={() => setShowReceipt(false)}
          onPrint={() => setShowReceipt(false)}
        />
      )}
      
      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={(result) => {
            if (result) {
              handleBarcodeSearch(result);
              setShowScanner(false);
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={shortcutsList}
      />
    </div>
  );
};

export default POS;
