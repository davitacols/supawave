import React, { useState, useEffect } from 'react';
import { CreditCardIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import PaystackTest from '../components/PaystackTest';

const Billing = () => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, plansRes, paymentsRes] = await Promise.all([
        api.get('/payments/status/'),
        api.get('/payments/plans/'),
        api.get('/payments/payments/')
      ]);
      
      setSubscription(subRes.data);
      setPlans(plansRes.data.results || plansRes.data || []);
      setPayments(paymentsRes.data.results || paymentsRes.data || []);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setPlans([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    setUpgrading(planId);
    try {
      const plan = plans.find(p => p.id === planId);
      console.log('Initializing payment for plan:', plan);
      
      if (!plan) {
        alert('Plan not found');
        return;
      }
      
      const response = await api.post('/payments/payments/initialize_paystack/', {
        amount: plan.price
      });
      
      console.log('Full payment response:', response);
      console.log('Payment response data:', response.data);
      
      if (response.data?.status && response.data?.data?.authorization_url) {
        console.log('Redirecting to:', response.data.data.authorization_url);
        window.location.href = response.data.data.authorization_url;
      } else if (response.data?.authorization_url) {
        console.log('Redirecting to (direct):', response.data.authorization_url);
        window.location.href = response.data.authorization_url;
      } else {
        console.error('No authorization URL found in response:', response.data);
        alert('Payment initialization failed: ' + (response.data?.message || JSON.stringify(response.data)));
      }
    } catch (error) {
      console.error('Payment error details:', error);
      console.error('Error response:', error.response);
      alert('Payment initialization failed: ' + (error.response?.data?.error || error.response?.data?.message || error.message));
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing information</p>
      </div>

      {/* Current Subscription */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Current Subscription</h2>
        {subscription ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-blue-600">{subscription.plan_name}</p>
              <p className="text-gray-600">₦{subscription.plan_price}/month</p>
              <p className="text-sm text-gray-500">
                Status: <span className={`font-medium ${
                  subscription.status === 'active' ? 'text-green-600' : 
                  subscription.status === 'trial' ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {subscription.status}
                </span>
              </p>
              {subscription.days_remaining > 0 && (
                <p className="text-sm text-gray-500">
                  {subscription.days_remaining} days remaining
                </p>
              )}
            </div>
            {subscription.status === 'trial' && (
              <div className="text-right">
                <p className="text-sm text-orange-600 font-medium">Trial Period</p>
                <p className="text-xs text-gray-500">Upgrade to continue after trial</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No active subscription</p>
        )}
      </div>

      {/* Available Plans */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.isArray(plans) && plans.map((plan) => (
            <div key={plan.id} className="border rounded-lg p-6 hover:border-blue-300 transition-colors">
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">₦{plan.price}/month</p>
              <ul className="space-y-2 mb-6">
                {Object.entries(plan.features || {}).map(([key, value]) => (
                  <li key={key} className="flex items-center text-sm">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    {value}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={subscription?.plan_name === plan.name || upgrading === plan.id}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {upgrading === plan.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : subscription?.plan_name === plan.name ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Paystack Test */}
      <PaystackTest />

      {/* Payment History */}
      <div className="bg-white shadow rounded-lg p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{payment.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Billing;