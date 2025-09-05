import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const OnboardingTour = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to SupaWave!",
      content: "Let's take a quick tour to get you started with your inventory management system.",
      target: null
    },
    {
      title: "Dashboard Overview",
      content: "Your dashboard shows key metrics like sales, inventory levels, and recent activities.",
      target: "dashboard"
    },
    {
      title: "Inventory Management",
      content: "Add, edit, and track your products. Set low stock alerts to never run out.",
      target: "inventory"
    },
    {
      title: "Point of Sale",
      content: "Process sales quickly with barcode scanning and keyboard shortcuts (F1-F12).",
      target: "pos"
    },
    {
      title: "Reports & Analytics",
      content: "Track your business performance with detailed sales and inventory reports.",
      target: "reports"
    },
    {
      title: "You're All Set!",
      content: "Start by adding your first products in the Inventory section. Need help? Press '?' for keyboard shortcuts.",
      target: null
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">{currentStepData.content}</p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-sky-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleComplete}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip Tour
            </button>
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              {currentStep < steps.length - 1 && <ChevronRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;