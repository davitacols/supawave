import React, { useState, useEffect } from 'react';
import { WifiIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import offlineStorage from '../utils/offlineStorage';
import { salesAPI } from '../utils/api';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSales, setPendingSales] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending sales
    const updatePendingSales = () => {
      const pending = offlineStorage.getPendingSales();
      setPendingSales(pending);
    };
    
    updatePendingSales();
    
    // Update pending sales when coming back online
    const handleOnlineWithUpdate = () => {
      setIsOnline(true);
      updatePendingSales();
    };
    
    window.addEventListener('online', handleOnlineWithUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline || syncing) return;
    
    setSyncing(true);
    try {
      const results = await offlineStorage.syncPendingSales(salesAPI);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        alert(`Successfully synced ${successCount} sales!`);
        setPendingSales(offlineStorage.getPendingSales());
      }
      
      const failedCount = results.filter(r => !r.success).length;
      if (failedCount > 0) {
        const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
        alert(`${failedCount} sales failed to sync: ${errors}. Check if products still exist.`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert(`Sync failed: ${error.message}. Please try again.`);
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && pendingSales.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg cursor-pointer ${
      isOnline ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-red-100 text-red-800'
    }`} onClick={isOnline ? handleSync : undefined}>
      <div className="flex items-center space-x-2">
        {syncing ? (
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
        ) : isOnline ? (
          <WifiIcon className="h-5 w-5" />
        ) : (
          <ExclamationTriangleIcon className="h-5 w-5" />
        )}
        <span className="text-sm font-medium">
          {syncing 
            ? 'Syncing...'
            : isOnline 
              ? `${pendingSales.length} sales pending sync - Click to sync`
              : 'Working offline'
          }
        </span>
        {isOnline && pendingSales.length > 0 && !syncing && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Clear all pending sales? This cannot be undone.')) {
                offlineStorage.clearPendingSales();
                setPendingSales([]);
              }
            }}
            className="ml-2 text-xs underline hover:no-underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;