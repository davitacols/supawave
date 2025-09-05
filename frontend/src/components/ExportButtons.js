import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const ExportButtons = ({ type = 'all', dateRange = null }) => {
  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (exportType) => {
    try {
      let url = `/exports/${exportType}/`;
      
      if (dateRange && (exportType === 'sales')) {
        const params = new URLSearchParams();
        if (dateRange.start) params.append('start_date', dateRange.start);
        if (dateRange.end) params.append('end_date', dateRange.end);
        url += `?${params.toString()}`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      downloadFile(downloadUrl, filename);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const exportOptions = [
    { key: 'products', label: 'Products', icon: '📦' },
    { key: 'sales', label: 'Sales', icon: '💰' },
    { key: 'inventory-report', label: 'Inventory Report', icon: '📊' },
    { key: 'backup', label: 'Full Backup', icon: '💾' }
  ];

  const filteredOptions = type === 'all' 
    ? exportOptions 
    : exportOptions.filter(option => option.key === type);

  return (
    <div className="flex flex-wrap gap-2">
      {filteredOptions.map((option) => (
        <button
          key={option.key}
          onClick={() => handleExport(option.key)}
          className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>{option.icon}</span>
          <span>Export {option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ExportButtons;