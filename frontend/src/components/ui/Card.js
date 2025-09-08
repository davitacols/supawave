import React from 'react';

export const Card = ({ children, className = "", hover = false, ...props }) => (
  <div className={`${hover ? 'card-hover' : 'card'} ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "", border = true }) => (
  <div className={`px-6 py-5 ${border ? 'border-b border-gray-100' : ''} ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "", size = "lg", ...props }) => {
  const sizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl"
  };
  
  return (
    <h3 className={`${sizes[size]} font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = "" }) => (
  <div className={`px-6 py-4 bg-gray-50 border-t border-gray-100 ${className}`}>
    {children}
  </div>
);