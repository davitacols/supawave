import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckIcon, XMarkIcon, QrCodeIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import BarcodeScanner from '../components/BarcodeScanner';

const StockTakeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stockTake, setStockTake] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockTake();
    fetchSummary();
  }, [id]);

  const fetchStockTake = async () => {
    try {
      const response = await api.get(`/inventory/stock-takes/${id}/`);
      setStockTake(response.data);
    } catch (error) {
      console.error('Error fetching stock take:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/inventory/stock-takes/${id}/summary/`);
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const updateCount = async (productId, count, reason = '', notes = '') => {
    try {
      await api.post(`/inventory/stock-takes/${id}/count/`, {
        product_id: productId,
        physical_count: count,
        variance_reason: reason,
        notes: notes
      });
      fetchStockTake();
      fetchSummary();
    } catch (error) {
      console.error('Error updating count:', error);
    }
  };

  const completeStockTake = async () => {
    if (window.confirm('Complete this stock take? This will update all product quantities to match physical counts.')) {
      try {
        await api.put(`/inventory/stock-takes/${id}/`, { status: 'completed' });
        navigate('/stock-take');
      } catch (error) {
        console.error('Error completing stock take:', error);
      }
    }
  };

  const handleBarcodeScanned = async (barcode) => {
    try {
      const response = await api.get(`/inventory/products/barcode/${barcode}/`);
      if (response.data.found) {
        const product = response.data.product;
        const item = stockTake.items.find(item => item.product === product.id);
        if (item) {
          setSelectedItem(item);
          setShowScanner(false);
        } else {
          alert('Product not found in this stock take');
        }
      } else {
        alert('Product not found');
      }
    } catch (error) {
      console.error('Error looking up barcode:', error);
    }
  };

  const filteredItems = stockTake?.items.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!stockTake) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Stock take not found</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate('/stock-take')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stockTake.name}</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {stockTake.category_name ? `${stockTake.category_name} Category` : 'All Products'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowScanner(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <QrCodeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Scan Barcode</span>
            </button>
            {stockTake.status === 'in_progress' && (
              <button
                onClick={completeStockTake}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Complete Count</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{summary.total_items}</div>
              <div className="text-xs sm:text-sm text-blue-600">Total Items</div>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{summary.counted_items}</div>
              <div className="text-xs sm:text-sm text-green-600">Counted</div>
            </div>
            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg text-center">
              <div className="text-lg sm:text-2xl font-bold text-orange-600">{summary.remaining_items}</div>
              <div className="text-xs sm:text-sm text-orange-600">Remaining</div>
            </div>
            <div className="bg-red-50 p-3 sm:p-4 rounded-lg text-center">
              <div className="text-lg sm:text-2xl font-bold text-red-600">{summary.variance_items}</div>
              <div className="text-xs sm:text-sm text-red-600">Variances</div>
            </div>
          </div>
        )}

        {summary && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(summary.progress)}% Complete</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${summary.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-medium">Products to Count</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Tap on any product to enter physical count. Green = counted, Red = variance detected
          </p>
        </div>
        
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? 'No products match your search' : 'No products in this stock take'}
            </div>
          ) : (
            filteredItems.map((item) => (
              <ProductItem
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      {selectedItem && (
        <CountModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={updateCount}
        />
      )}
    </div>
  );
};

const ProductItem = ({ item, onClick }) => {
  const isCounted = item.physical_count > 0;
  const hasVariance = item.variance !== 0;
  
  const getBorderColor = () => {
    if (!isCounted) return 'border-l-gray-300';
    if (hasVariance) return 'border-l-red-500';
    return 'border-l-green-500';
  };

  const getVarianceColor = (variance) => {
    if (variance === 0) return 'text-gray-600';
    return variance > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div 
      onClick={onClick}
      className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${getBorderColor()}`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.product_name}</h3>
          <p className="text-xs sm:text-sm text-gray-500">SKU: {item.product_sku}</p>
          {item.variance_reason && (
            <p className="text-xs text-orange-600 mt-1">Reason: {item.variance_reason}</p>
          )}
        </div>
        <div className="text-left sm:text-right space-y-1">
          <div className="text-xs sm:text-sm">
            <span className="text-gray-500">System: </span>
            <span className="font-medium">{item.system_count}</span>
          </div>
          <div className="text-xs sm:text-sm">
            <span className="text-gray-500">Physical: </span>
            <span className="font-medium">{item.physical_count}</span>
          </div>
          <div className={`text-xs sm:text-sm font-medium ${getVarianceColor(item.variance)}`}>
            Variance: {item.variance > 0 ? '+' : ''}{item.variance}
          </div>
        </div>
      </div>
    </div>
  );
};

const CountModal = ({ item, onClose, onUpdate }) => {
  const [count, setCount] = useState(item.physical_count);
  const [reason, setReason] = useState(item.variance_reason || '');
  const [notes, setNotes] = useState(item.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(item.product, parseInt(count), reason, notes);
    onClose();
  };

  const variance = count - item.system_count;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{item.product_name}</h2>
          <button onClick={onClose}>
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">System Count: <span className="font-medium">{item.system_count}</span></p>
          <p className="text-sm text-gray-500">Enter the actual quantity you physically counted</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Count</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-lg"
              autoFocus
            />
          </div>
          
          {variance !== 0 && (
            <div className={`p-3 rounded-md ${variance > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${variance > 0 ? 'text-green-800' : 'text-red-800'}`}>
                Variance Detected: {variance > 0 ? '+' : ''}{variance}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {variance > 0 ? 'You have more than expected' : 'You have less than expected'}
              </p>
            </div>
          )}
          
          {variance !== 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variance Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select reason for variance</option>
                  <option value="damaged">Damaged/Broken</option>
                  <option value="expired">Expired</option>
                  <option value="theft">Theft/Missing</option>
                  <option value="miscount">Previous Miscount</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional details about the variance..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Save Count
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTakeDetail;