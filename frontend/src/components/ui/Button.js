import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "primary", 
  className = "",
  ...props 
}) => {
  const baseClasses = "px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500"
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabledClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};