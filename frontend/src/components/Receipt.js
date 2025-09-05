import React from 'react';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Receipt = ({ sale, business, onClose, onPrint }) => {
  const handlePrint = () => {
    window.print();
    onPrint && onPrint();
  };

  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header Controls */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 print:hidden">
          <h3 className="text-lg font-semibold text-gray-900">Receipt Generated</h3>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 receipt-content">
          {/* Business Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center overflow-hidden">
              {business?.logo ? (
                <img 
                  src={business.logo} 
                  alt="Business Logo" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🛒</span>
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{business?.name || 'SupaWave Store'}</h2>
            {business?.address && (
              <p className="text-sm text-gray-600 mt-1">{business.address}</p>
            )}
            {business?.phone && (
              <p className="text-sm text-gray-600">Tel: {business.phone}</p>
            )}
            {business?.email && (
              <p className="text-sm text-gray-600">Email: {business.email}</p>
            )}
          </div>

          {/* Sale Info */}
          <div className="border-t border-b border-gray-300 py-3 mb-4">
            <div className="flex justify-between text-sm">
              <span>Receipt #:</span>
              <span className="font-mono">{sale.id?.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Date:</span>
              <span>{new Date(sale.created_at || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cashier:</span>
              <span>{business?.owner?.first_name || 'Staff'}</span>
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Items:</h3>
            <div className="space-y-2">
              {sale.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.product?.name || `Item ${index + 1}`}</div>
                    <div className="text-gray-600">
                      {item.quantity} x ₦{parseFloat(item.unit_price).toLocaleString()}
                    </div>
                  </div>
                  <div className="font-medium">
                    ₦{(item.quantity * parseFloat(item.unit_price)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-300 pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span>₦{parseFloat(sale.total_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Payment Method:</span>
              <span>Cash</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-300">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2 print:hidden">
              Powered by SupaWave POS System
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .receipt-content,
          .receipt-content * {
            visibility: visible;
          }
          
          .receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 12px;
            line-height: 1.4;
          }
          
          /* Hide browser headers and footers */
          html {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Receipt;