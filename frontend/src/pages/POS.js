import React, { useState, useEffect } from 'react';
import { inventoryAPI, salesAPI, authAPI } from '../utils/api';
import { 
  PlusIcon, MinusIcon, TrashIcon, MagnifyingGlassIcon, 
  ShoppingCartIcon, CreditCardIcon, ChevronLeftIcon, ChevronRightIcon,
  QrCodeIcon, BoltIcon, CpuChipIcon, CalculatorIcon, UserIcon,
  ClockIcon, CheckCircleIcon, XMarkIcon, ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import Receipt from '../components/Receipt';
import BarcodeScanner from '../components/BarcodeScanner';
import AdvancedBarcodeScanner from '../components/AdvancedBarcodeScanner';
import PaystackPayment from '../components/PaystackPayment';
import CustomerLookup from '../components/CustomerLookup';
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
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [showPaystackPayment, setShowPaystackPayment] = useState(false);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [showAdvancedScanner, setShowAdvancedScanner] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
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
        allProducts = response.data.products || response.data.results || response.data || [];
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

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  const getTax = () => {
    const subtotal = getSubtotal();
    return (subtotal * taxRate) / 100;
  };

  const getTotalAmount = () => {
    const subtotal = getSubtotal();
    const tax = getTax();
    return subtotal + tax - discount;
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerPhone(customer.phone);
    setCustomerEmail(customer.email || '');
  };

  const handlePaystackSuccess = (paymentData) => {
    setShowPaystackPayment(false);
    // Process the sale with payment reference
    handleCheckout(paymentData);
  };

  const handleCheckout = async (paymentData = null) => {
    if (cart.length === 0) return;
    
    // For card payments, show Paystack modal
    if (paymentMethod === 'card' && !paymentData) {
      if (!customerEmail) {
        alert('Email is required for card payments');
        return;
      }
      setShowPaystackPayment(true);
      return;
    }
    
    setLoading(true);
    try {
      const saleData = {
        total_amount: getTotalAmount().toFixed(2),
        subtotal: getSubtotal().toFixed(2),
        tax_amount: getTax().toFixed(2),
        discount: discount,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        customer_id: selectedCustomer?.id || null,
        payment_method: paymentMethod,
        payment_reference: paymentData?.reference || null,
        notes: notes,
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
      setCustomerPhone('');
      setCustomerEmail('');
      setSelectedCustomer(null);
      setDiscount(0);
      setNotes('');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Modern Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CalculatorIcon className="h-8 w-8 text-blue-600 mr-3" />
                Point of Sale
              </h1>
              <p className="text-gray-600 mt-2 flex items-center">
                <CpuChipIcon className="h-4 w-4 mr-2 text-blue-500" />
                Smart checkout with real-time inventory tracking
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Barcode Scanner */}
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                <QrCodeIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Scan barcode..."
                  className="bg-transparent border-none outline-none text-sm w-40"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={handleBarcodeKeyPress}
                />
                <button
                  onClick={() => setShowAdvancedScanner(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  Advanced Scan
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ArchiveBoxIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Available Products
                  </h2>
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              </div>
              
              {productsLoading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading products...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {products.map((product, index) => (
                        <div
                          key={product.id}
                          className="group relative border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 bg-white"
                          onClick={() => addToCart(product)}
                        >
                          {/* Function Key Indicator */}
                          {index < 12 && (
                            <div className="absolute top-2 right-2 bg-blue-100 text-blue-600 text-xs font-mono px-2 py-1 rounded-md">
                              F{index + 1}
                            </div>
                          )}
                          
                          {/* Product Image */}
                          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <div className="text-3xl">📦</div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-bold text-blue-600">₦{product.selling_price?.toLocaleString()}</p>
                              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                Stock: {product.stock_quantity}
                              </div>
                            </div>
                          </div>
                          
                          {/* Add to Cart Overlay */}
                          <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all duration-200 flex items-center justify-center">
                            <PlusIcon className="h-8 w-8 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, products.length)} products
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
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

          {/* Cart & Checkout Section */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ShoppingCartIcon className="h-5 w-5 mr-2 text-green-600" />
                    Shopping Cart
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                      {cart.length} items
                    </span>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setCart([])}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Cart is empty</p>
                    <p className="text-gray-400 text-sm">Add products to start a sale</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{item.product.name}</h4>
                            <p className="text-blue-600 font-bold text-lg">₦{item.unit_price?.toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => updateQuantity(item.product.id, 0)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="font-bold text-lg text-gray-900">₦{(item.quantity * item.unit_price).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Checkout Section */}
            {cart.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Checkout
                  </h3>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Customer Info */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Customer Information
                      </label>
                      <button
                        onClick={() => setShowCustomerLookup(true)}
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                      >
                        Select Customer
                      </button>
                    </div>
                    
                    {selectedCustomer ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-blue-900">{selectedCustomer.name}</p>
                            <p className="text-sm text-blue-700">{selectedCustomer.phone}</p>
                            {selectedCustomer.email && (
                              <p className="text-sm text-blue-600">{selectedCustomer.email}</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCustomer(null);
                              setCustomerPhone('');
                              setCustomerEmail('');
                            }}
                            className="text-blue-400 hover:text-blue-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            placeholder="Customer phone (optional)"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                          />
                        </div>
                        <input
                          type="email"
                          placeholder="Customer email (required for card payments)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="transfer">Bank Transfer</option>
                      <option value="mobile">Mobile Money</option>
                    </select>
                  </div>

                  {/* Tax Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount (₦)</label>
                    <input
                      type="number"
                      min="0"
                      max={getSubtotal()}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      rows="2"
                      placeholder="Add notes for this sale..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">₦{getSubtotal().toLocaleString()}</span>
                    </div>
                    {taxRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax ({taxRate}%):</span>
                        <span className="font-semibold text-green-600">+₦{getTax().toLocaleString()}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-semibold text-red-600">-₦{discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span className="text-2xl text-blue-600">₦{getTotalAmount().toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-semibold text-lg transition-all duration-200 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Complete Sale
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
      
      {showAdvancedScanner && (
        <AdvancedBarcodeScanner
          onScan={(barcode, product) => {
            if (product) {
              addToCart(product);
            }
          }}
          onAddToCart={addToCart}
          onClose={() => setShowAdvancedScanner(false)}
        />
      )}
      
      {showPaystackPayment && (
        <PaystackPayment
          amount={getTotalAmount()}
          customerEmail={customerEmail}
          customerPhone={customerPhone}
          business={business}
          onSuccess={handlePaystackSuccess}
          onClose={() => setShowPaystackPayment(false)}
        />
      )}
      
      {showCustomerLookup && (
        <CustomerLookup
          onSelectCustomer={handleCustomerSelect}
          onClose={() => setShowCustomerLookup(false)}
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