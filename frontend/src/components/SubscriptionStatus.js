import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const SubscriptionStatus = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/payments/status/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      const response = await fetch('/api/payments/cancel/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        fetchSubscriptionStatus();
        alert('Subscription cancelled successfully');
      }
    } catch (error) {
      alert('Error cancelling subscription');
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  if (!subscription || subscription.status === 'no_subscription') {
    return (
      <Card className="border-red-200">
        <CardContent className="text-center py-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700">No Active Subscription</h3>
          <p className="text-gray-600 mb-4">Subscribe to continue using SupaWave</p>
          <Button onClick={() => window.location.href = '/subscribe'}>
            Choose a Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'trial': return 'text-blue-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'active' || status === 'trial') {
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    }
    return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {getStatusIcon(subscription.status)}
          <span className="ml-2">Subscription Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">{subscription.plan}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium capitalize ${getStatusColor(subscription.status)}`}>
              {subscription.status}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Days Remaining:</span>
            <span className={`font-medium ${subscription.days_remaining <= 7 ? 'text-red-600' : 'text-green-600'}`}>
              {subscription.days_remaining} days
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Auto Renew:</span>
            <span className={`font-medium ${subscription.auto_renew ? 'text-green-600' : 'text-red-600'}`}>
              {subscription.auto_renew ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {subscription.days_remaining <= 7 && subscription.status !== 'expired' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 text-sm">
                  Your subscription expires in {subscription.days_remaining} days. 
                  Renew now to avoid service interruption.
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button onClick={() => window.location.href = '/subscribe'} className="flex-1">
              Upgrade Plan
            </Button>
            {subscription.auto_renew && (
              <Button variant="outline" onClick={handleCancelSubscription}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;