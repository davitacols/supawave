import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';
import api from '../utils/api';

const SellFromInventoryModal = ({ isOpen, onClose, onSubmit }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    listing_type: 'sell',
    quantity: '',
    unit_price: '',
    description: '',
    location: '',
    delivery_available: false,
    delivery_radius: '5'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching inventory products...');
      const response = await api.get('/inventory/products/');
      console.log('Products response:', response.data);
      
      // Handle different response formats
      let productList = [];
      if (Array.isArray(response.data)) {
        productList = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        productList = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productList = response.data.data;
      }
      
      console.log('Processed products:', productList);
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error details:', error.response?.data);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      unit_price: product.selling_price,
      quantity: Math.min(product.stock_quantity, 10) // Default to 10 or available stock
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Please select a product from your inventory');
      return;
    }

    const listingData = {
      ...formData,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      category: selectedProduct.category?.name || '',
      title: `${selectedProduct.name} - Available from Inventory`
    };

    onSubmit(listingData);
    handleClose();
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setFormData({
      listing_type: 'sell',
      quantity: '',
      unit_price: '',
      description: '',
      location: '',
      delivery_available: false,
      delivery_radius: '5'
    });
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sell from Inventory</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product from Your Inventory
              </label>
              {loading ? (
                <div className="text-center py-4">Loading products...</div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                  {products.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No products in inventory. Add products first.
                    </div>
                  ) : (
                    products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedProduct?.id === product.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              Stock: {product.stock_quantity} | Price: ₦{product.selling_price}
                            </p>
                            {product.category && (
                              <p className="text-xs text-gray-500">{product.category.name}</p>
                            )}
                          </div>
                          {selectedProduct?.id === product.id && (
                            <div className="text-blue-600 font-medium">Selected</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedProduct && (
              <>
                {/* Selected Product Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Product</h4>
                  <p className="text-sm text-blue-800">
                    <strong>{selectedProduct.name}</strong> - Available: {selectedProduct.stock_quantity} units
                  </p>
                  <p className="text-sm text-blue-800">
                    Current Price: ₦{selectedProduct.selling_price}
                  </p>
                </div>

                {/* Quantity & Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity to Sell
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      max={selectedProduct.stock_quantity}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max available: {selectedProduct.stock_quantity}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price (₦)
                    </label>
                    <input
                      type="number"
                      name="unit_price"
                      value={formData.unit_price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Add any special notes about condition, expiry, bulk discounts, etc. (Optional - will auto-generate if empty)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Lagos Island, Lagos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Delivery Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="delivery_available"
                      checked={formData.delivery_available}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      I can deliver this product
                    </label>
                  </div>
                  {formData.delivery_available && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Radius (km)
                      </label>
                      <input
                        type="number"
                        name="delivery_radius"
                        value={formData.delivery_radius}
                        onChange={handleChange}
                        min="1"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Total Value Display */}
                {formData.quantity && formData.unit_price && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Value:</span>
                      <span className="text-lg font-semibold text-green-600">
                        ₦{(parseFloat(formData.quantity || 0) * parseFloat(formData.unit_price || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={!selectedProduct}>
                Create Listing
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellFromInventoryModal;