import React, { useState, useEffect } from 'react';
import ScanButton from './ScanButton';

const InventoryWithScanner = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory/products/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleProductFound = (product) => {
    setSelectedProduct(product);
    // Scroll to product in list
    const productElement = document.getElementById(`product-${product.id}`);
    if (productElement) {
      productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      productElement.classList.add('bg-yellow-100');
      setTimeout(() => {
        productElement.classList.remove('bg-yellow-100');
      }, 2000);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <ScanButton 
            onProductFound={handleProductFound}
            className="text-lg px-6 py-3"
          />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products by name or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Selected Product Info */}
        {selectedProduct && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Scanned Product:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span>
                <p>{selectedProduct.name}</p>
              </div>
              <div>
                <span className="font-medium">Barcode:</span>
                <p>{selectedProduct.barcode}</p>
              </div>
              <div>
                <span className="font-medium">Price:</span>
                <p>₦{selectedProduct.selling_price}</p>
              </div>
              <div>
                <span className="font-medium">Stock:</span>
                <p className={selectedProduct.is_low_stock ? 'text-red-600 font-semibold' : ''}>
                  {selectedProduct.stock_quantity}
                  {selectedProduct.is_low_stock && ' (Low Stock!)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-4">
            Products ({filteredProducts.length})
          </h3>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No products found</p>
              <p className="text-sm">Try scanning a barcode or adjusting your search</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div
                key={product.id}
                id={`product-${product.id}`}
                className={`p-4 border rounded-lg transition-colors duration-500 ${
                  selectedProduct?.id === product.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.barcode}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-semibold">₦{product.selling_price}</span>
                  </div>
                  <div className="text-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      product.is_low_stock 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      Stock: {product.stock_quantity}
                    </span>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    {new Date(product.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-center">
                    <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryWithScanner;