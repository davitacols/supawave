import React, { useState, useEffect } from 'react';
import { inventoryAPI, salesAPI, authAPI } from '../utils/api';
import { 
  PlusIcon, MinusIcon, TrashIcon, MagnifyingGlassIcon, 
  ShoppingCartIcon, CreditCardIcon, XMarkIcon, QrCodeIcon
} from '@heroicons/react/24/outline';
import Receipt from '../components/Receipt';
import BarcodeScanner from '../components/BarcodeScanner';
import offlineStorage from '../utils/offlineStorage';

const MobilePOS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchBusiness();
  }, [search]);

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
      setProducts(availableProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      const cachedProducts = offlineStorage.getProducts().filter(p => p.stock_quantity > 0);
      setProducts(cachedProducts);
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
      setShowCart(false);
      fetchProducts();
      setShowReceipt(true);
    } catch (error) {
      alert('Error processing sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Point of Sale</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowScanner(true)}
                className="bg-gray-600 text-white p-2 rounded-full"
                title="Scan Barcode"
              >
                <QrCodeIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-blue-600 text-white p-2 rounded-full"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-3">
        {productsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-2xl text-blue-400">📦</div>
                  )}
                  
                  {/* Stock Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
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
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-blue-600">
                      ₦{product.selling_price?.toLocaleString()}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock_quantity === 0}
                    className="w-full bg-blue-600 text-white py-2 px-3 text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[80vh] rounded-t-xl overflow-hidden">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Cart ({cart.length} items)</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {item.product.name}
                          </h4>
                          <p className="text-blue-600 font-semibold text-sm">
                            ₦{item.unit_price?.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => updateQuantity(item.product.id, 0)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center"
                          >
                            <MinusIcon className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center"
                          >
                            <PlusIcon className="h-3 w-3" />
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
              )}
            </div>
            
            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ₦{getTotalAmount().toLocaleString()}
                  </span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CreditCardIcon className="h-5 w-5" />
                      <span>Complete Sale</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
};

export default MobilePOS;