import React from 'react';

export const Input = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  className = "",
  ...props 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  </div>
);

export const Select = ({ 
  label, 
  value, 
  onChange, 
  children, 
  className = "",
  ...props 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    >
      {children}
    </select>
  </div>
);