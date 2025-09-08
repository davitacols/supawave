import React from 'react';

export const Input = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  className = "",
  error,
  hint,
  icon,
  ...props 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">{icon}</span>
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? 'input-error' : ''} ${icon ? 'pl-10' : ''}`}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1 text-sm text-error-600">{error}</p>
    )}
    {hint && !error && (
      <p className="mt-1 text-sm text-gray-500">{hint}</p>
    )}
  </div>
);

export const Select = ({ 
  label, 
  value, 
  onChange, 
  children, 
  className = "",
  error,
  hint,
  ...props 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      className={`input ${error ? 'input-error' : ''}`}
      {...props}
    >
      {children}
    </select>
    {error && (
      <p className="mt-1 text-sm text-error-600">{error}</p>
    )}
    {hint && !error && (
      <p className="mt-1 text-sm text-gray-500">{hint}</p>
    )}
  </div>
);

export const Textarea = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  className = "",
  error,
  hint,
  rows = 4,
  ...props 
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`input resize-none ${error ? 'input-error' : ''}`}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-error-600">{error}</p>
    )}
    {hint && !error && (
      <p className="mt-1 text-sm text-gray-500">{hint}</p>
    )}
  </div>
);