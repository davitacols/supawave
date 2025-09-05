import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { inventoryAPI } from '../utils/api';
import { MagnifyingGlassIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from './BarcodeScanner';

const PriceChecker = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const searchProduct = async () => {
    if (!search.trim()) return;
    
    setLoading(true);
    try {
      const response = await inventoryAPI.getProducts(search);
      if (response.data.length > 0) {
        setProduct(response.data[0]);
      } else {
        setProduct(null);
        alert('Product not found');
      }
    } catch (error) {
      console.error('Error searching product:', error);
      alert('Error searching product');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeFound = (foundProduct) => {
    setProduct(foundProduct);
    setShowScanner(false);
    setSearch(foundProduct.name);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchProduct();
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Price Checker">
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={() => setShowScanner(true)} variant="outline">
              <QrCodeIcon className="h-4 w-4" />
            </Button>
            <Button onClick={searchProduct} disabled={loading}>
              <MagnifyingGlassIcon className="h-4 w-4" />
            </Button>
          </div>

          {product && (
            <Card>
              <CardContent>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ₦{product.selling_price}
                      </div>
                      <div className="text-sm text-green-500">Selling Price</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {product.stock_quantity}
                      </div>
                      <div className="text-sm text-blue-500">In Stock</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <div><strong>Category:</strong> {product.category_name || 'N/A'}</div>
                    <div><strong>Supplier:</strong> {product.supplier_name || 'N/A'}</div>
                    {product.barcode && (
                      <div><strong>Barcode:</strong> {product.barcode}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </Modal>

      {showScanner && (
        <BarcodeScanner
          onProductFound={handleBarcodeFound}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
};

export default PriceChecker;