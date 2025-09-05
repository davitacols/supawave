import React, { useState } from 'react';
import { XMarkIcon, CreditCardIcon } from '@heroicons/react/24/outline';

const PaymentModal = ({ isOpen, onClose, onPayment, amount, description }) => {
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      await onPayment(paymentMethod, amount);
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">{description}</p>
          <p className="text-2xl font-bold text-blue-600">₦{amount?.toLocaleString()}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="paystack"
                checked={paymentMethod === 'paystack'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Card Payment (Paystack)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="transfer"
                checked={paymentMethod === 'transfer'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Bank Transfer
            </label>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;