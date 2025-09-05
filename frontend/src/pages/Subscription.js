import React, { useState, useEffect } from 'react';
import { CreditCardIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptionStatus();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscriptions/status/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (planName) => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/initiate/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: planName })
      });

      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error) {
      alert('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch('/api/subscriptions/backup/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        alert('Backup created successfully!');
      } else {
        alert('Backup failed');
      }
    } catch (error) {
      alert('Backup failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600 mt-2">Choose the perfect plan for your business</p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="bg-blue-50 border border-blue-200  p-4">
          <h3 className="font-semibold text-blue-900">Current Subscription</h3>
          <p className="text-blue-700">
            Plan: {currentSubscription.plan} | Status: {currentSubscription.status}
            {currentSubscription.days_remaining > 0 && (
              <span> | {currentSubscription.days_remaining} days remaining</span>
            )}
          </p>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className="border  p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold mb-2">{plan.display_name}</h3>
            <div className="text-3xl font-bold text-red-600 mb-4">
              ₦{plan.price.toLocaleString()}
              <span className="text-sm text-gray-500">/month</span>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                Up to {plan.max_products} products
              </li>
              <li className="flex items-center">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                Up to {plan.max_staff} staff members
              </li>
              <li className="flex items-center">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                Daily backups
              </li>
              <li className="flex items-center">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                24/7 support
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe(plan.name)}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4  hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Backup Section */}
      <div className="bg-gray-50  p-6">
        <h3 className="text-lg font-semibold mb-4">Data Backup</h3>
        <p className="text-gray-600 mb-4">
          Protect your business data with regular backups. Create a backup now or schedule automatic daily backups.
        </p>
        <button
          onClick={createBackup}
          className="bg-blue-600 text-white px-4 py-2  hover:bg-blue-700"
        >
          Create Backup Now
        </button>
      </div>
    </div>
  );
};

export default Subscription;
