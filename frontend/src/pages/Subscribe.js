import React, { useState } from 'react';
import SubscriptionPlans from '../components/SubscriptionPlans';
import PaymentModal from '../components/PaymentModal';

const Subscribe = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isYearly, setIsYearly] = useState(false);

  const handleSelectPlan = (planId, yearly) => {
    setSelectedPlan(planId);
    setIsYearly(yearly);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SubscriptionPlans onSelectPlan={handleSelectPlan} />
        
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          planId={selectedPlan}
          isYearly={isYearly}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
};

export default Subscribe;
