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

  if (isMobile) {
    return <MobilePOS />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Point of Sale</h1>
            <p className="text-sm text-gray-600 mt-1">Process sales and manage transactions</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Scan barcode..."
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleBarcodeKeyPress}
              />
              <button
                onClick={() => setShowScanner(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Scan
              </button>
            </div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Products */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Products</h2>
              </div>
              
              {productsLoading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {products.map((product, index) => (
                        <div
                          key={product.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer"
                          onClick={() => addToCart(product)}
                        >
                          {index < 12 && (
                            <div className="text-xs text-blue-600 font-mono mb-2">F{index + 1}</div>
                          )}
                          <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <div className="text-2xl">📦</div>
                            )}
                          </div>
                          <h3 className="font-medium text-sm text-gray-900 mb-1 truncate">{product.name}</h3>
                          <p className="text-lg font-semibold text-blue-600">₦{product.selling_price?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Stock: {product.stock_quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">Page {currentPage} of {totalPages}</div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white border border-gray-200 rounded-lg h-fit">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Cart</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {cart.length}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900">{item.product.name}</h4>
                            <p className="text-blue-600 font-semibold">₦{item.unit_price?.toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => updateQuantity(item.product.id, 0)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="font-semibold">₦{(item.quantity * item.unit_price).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">₦{getTotalAmount().toLocaleString()}</span>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Complete Sale'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReceipt && (
        <Receipt
          sale={lastSale}
          business={business}
          onClose={() => setShowReceipt(false)}
          onPrint={() => setShowReceipt(false)}
        />
      )}
      
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
      
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={shortcutsList}
      />
    </div>
  );
};

export default POS;