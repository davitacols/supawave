import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckIcon } from '@heroicons/react/24/outline';

const SubscriptionPlans = ({ onSelectPlan }) => {
  const [plans, setPlans] = useState([]);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/payments/plans/', {
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">Select the perfect plan for your business</p>
        
        <div className="flex items-center justify-center mt-4">
          <span className={`mr-3 ${!isYearly ? 'font-semibold' : ''}`}>Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isYearly ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isYearly ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className={`ml-3 ${isYearly ? 'font-semibold' : ''}`}>
            Yearly <span className="text-green-600 text-sm">(Save 20%)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.plan_type === 'premium' ? 'border-blue-500 border-2' : ''}`}>
            {plan.plan_type === 'premium' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">Most Popular</span>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {formatPrice(isYearly ? plan.price_yearly : plan.price_monthly)}
                </span>
                <span className="text-gray-600">/{isYearly ? 'year' : 'month'}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  Up to {plan.max_products} products
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  {plan.max_users} user accounts
                </li>
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => onSelectPlan(plan.id, isYearly)}
                className="w-full"
                variant={plan.plan_type === 'premium' ? 'default' : 'outline'}
              >
                Choose Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;