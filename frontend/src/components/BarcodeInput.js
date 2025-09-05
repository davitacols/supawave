import React, { useState } from 'react';
import { QrCodeIcon, XMarkIcon } from '@heroicons/react/24/outline';

const BarcodeInput = ({ onScan, onClose, isOpen }) => {
  const [barcode, setBarcode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <QrCodeIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Enter Barcode</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scan or type barcode..."
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Use a USB barcode scanner</p>
            <p>• Type the barcode manually</p>
            <p>• Press Enter to search</p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!barcode.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BarcodeInput;