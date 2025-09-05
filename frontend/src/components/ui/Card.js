import React from 'react';

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white shadow border ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "", style = {} }) => (
  <h3 className={`text-lg font-medium text-gray-900 ${className}`} style={style}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);