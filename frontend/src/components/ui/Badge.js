import React from 'react';

export const Badge = ({ 
  children, 
  variant = "primary", 
  size = "md",
  className = "",
  ...props 
}) => {
  const sizes = {
    sm: "px-2 py-0.5 text-2xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };
  
  const variants = {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    gray: "bg-gray-100 text-gray-700"
  };

  return (
    <span 
      className={`badge ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};