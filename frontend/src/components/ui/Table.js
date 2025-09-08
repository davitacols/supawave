import React from 'react';

export const Table = ({ children, className = "" }) => (
  <div className={`overflow-hidden ${className}`}>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {children}
      </table>
    </div>
  </div>
);

export const TableHeader = ({ children, className = "" }) => (
  <thead className={`bg-gray-50 ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = "" }) => (
  <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = "", hover = true, ...props }) => (
  <tr 
    className={`${hover ? 'hover:bg-gray-50' : ''} transition-colors ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = "", sortable = false, ...props }) => (
  <th 
    className={`
      px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider
      ${sortable ? 'cursor-pointer hover:text-gray-700' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = "", ...props }) => (
  <td 
    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
    {...props}
  >
    {children}
  </td>
);

export const TableEmpty = ({ 
  message = "No data available", 
  icon: Icon,
  className = "" 
}) => (
  <tr>
    <td colSpan="100%" className={`px-6 py-12 text-center ${className}`}>
      <div className="flex flex-col items-center">
        {Icon && <Icon className="h-12 w-12 text-gray-300 mb-4" />}
        <p className="text-gray-500 font-medium">{message}</p>
      </div>
    </td>
  </tr>
);

export const TableCard = ({ children, title, description, actions, className = "" }) => (
  <div className={`card ${className}`}>
    {(title || description || actions) && (
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center space-x-3">{actions}</div>}
        </div>
      </div>
    )}
    <div className="overflow-hidden">
      {children}
    </div>
  </div>
);