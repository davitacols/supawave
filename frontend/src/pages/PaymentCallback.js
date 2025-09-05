import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    console.log('PaymentCallback mounted');
    console.log('Search params:', Object.fromEntries(searchParams));
    verifyPayment();
  }, []);

  // Add fallback rendering
  console.log('Rendering PaymentCallback, status:', status);

  const verifyPayment = async () => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    
    if (!reference) {
      setStatus('error');
      setMessage('No payment reference found');
      return;
    }

    try {
      const response = await api.post('/payments/payments/verify_paystack/', {
        reference: reference
      });

      if (response.data.status === 'success') {
        setStatus('success');
        setMessage('Payment successful! Your subscription has been activated.');
        setTimeout(() => navigate('/billing'), 3000);
      } else {
        setStatus('error');
        setMessage('Payment verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Payment verification failed: ' + (error.response?.data?.error || error.message));
    }
  };

  // Fallback for debugging
  if (!status) {
    return <div>Loading callback page...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to billing page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/billing')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Billing
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;