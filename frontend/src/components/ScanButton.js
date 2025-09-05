import React, { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';
import { useBarcode } from '../hooks/useBarcode';

const ScanButton = ({ onProductFound, className = '' }) => {
  const [showScanner, setShowScanner] = useState(false);
  const { lookupBarcode, loading } = useBarcode();

  const handleScan = async (barcode) => {
    setShowScanner(false);
    
    const result = await lookupBarcode(barcode);
    
    if (result && result.found) {
      onProductFound(result.product);
    } else {
      alert(`Product not found for barcode: ${barcode}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowScanner(true)}
        disabled={loading}
        className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ${className}`}
      >
        📷 {loading ? 'Looking up...' : 'Scan Barcode'}
      </button>
      
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
};

export default ScanButton;