import React, { useState } from 'react';
import { PaystackButton } from 'react-paystack';
import { CreditCardIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PaystackPayment = ({ amount, customerEmail, customerPhone, onSuccess, onClose, business }) => {
  const [loading, setLoading] = useState(false);

  const publicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here';

  const componentProps = {
    email: customerEmail || 'customer@example.com',
    amount: Math.round(amount * 100), // Paystack expects amount in kobo
    publicKey,
    text: `Pay ₦${amount.toLocaleString()}`,
    onSuccess: (reference) => {
      setLoading(false);
      onSuccess(reference);
    },
    onClose: () => {
      setLoading(false);
      onClose();
    },
    metadata: {
      custom_fields: [
        {
          display_name: "Phone Number",
          variable_name: "phone_number",
          value: customerPhone || ""
        }
      ]
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2 text-blue-600" />
            Card Payment
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              ₦{amount.toLocaleString()}
            </div>
            <p className="text-gray-600">
              {business?.name || 'Business Name'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="text"
                value={`₦${amount.toLocaleString()}`}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
              />
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <PaystackButton
              {...componentProps}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              onSuccess={(reference) => {
                onSuccess({
                  reference: reference.reference,
                  status: 'success',
                  transaction: reference.transaction,
                  message: reference.message
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaystackPayment;