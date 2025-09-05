import React, { useState } from 'react';
import api from '../utils/api';

const PaystackTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testPaystack = async () => {
    setLoading(true);
    try {
      const response = await api.post('/payments/payments/test_paystack/');
      setResult(response.data);
      
      if (response.data.status && response.data.data?.authorization_url) {
        // Open Paystack checkout in new window
        window.open(response.data.data.authorization_url, '_blank');
      }
    } catch (error) {
      setResult({ error: error.response?.data?.error || 'Test failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Test Paystack Integration</h3>
      
      <button
        onClick={testPaystack}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test ₦50 Payment'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Result:</h4>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PaystackTest;