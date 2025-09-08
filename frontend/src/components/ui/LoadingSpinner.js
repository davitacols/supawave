import React from 'react';

export const LoadingSpinner = ({ 
  size = "md", 
  className = "",
  color = "primary"
}) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };
  
  const colors = {
    primary: "text-primary-600",
    white: "text-white",
    gray: "text-gray-600"
  };

  return (
    <div className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`}>
      <svg fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export const LoadingCard = ({ title = "Loading...", className = "" }) => (
  <div className={`card p-6 ${className}`}>
    <div className="flex items-center justify-center space-x-3 py-8">
      <LoadingSpinner size="lg" />
      <span className="text-gray-600 font-medium">{title}</span>
    </div>
  </div>
);

export const LoadingPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="xl" className="mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading</h2>
      <p className="text-gray-600">Please wait while we prepare your dashboard</p>
    </div>
  </div>
);