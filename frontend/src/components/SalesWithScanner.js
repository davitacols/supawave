import React, { useState } from 'react';
import ScanButton from './ScanButton';

const SalesWithScanner = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Increase quantity
      const updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updatedCart);
    } else {
      // Add new item
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    updateTotal();
  };

  const updateTotal = () => {
    const newTotal = cart.reduce((sum, item) => 
      sum + (item.selling_price * item.quantity), 0
    );
    setTotal(newTotal);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    updateTotal();
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    
    const saleData = {
      total_amount: total.toFixed(2),
      items: cart.map(item => ({
        product: item.id,
        quantity: item.quantity,
        unit_price: item.selling_price.toString()
      }))
    };

    try {
      const response = await fetch('/api/sales/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        alert('Sale completed successfully!');
        setCart([]);
        setTotal(0);
      } else {
        alert('Sale failed. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please check your connection.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Point of Sale</h2>
          <ScanButton 
            onProductFound={addToCart}
            className="text-lg px-6 py-3"
          />
        </div>

        {/* Cart Items */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Cart Items</h3>
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No items in cart</p>
              <p className="text-sm">Scan a barcode to add products</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ₦{item.selling_price} × {item.quantity}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">
                      ₦{(item.selling_price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total and Checkout */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-2xl font-bold text-green-600">
              ₦{total.toFixed(2)}
            </span>
          </div>
          
          <button
            onClick={completeSale}
            disabled={cart.length === 0}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesWithScanner;