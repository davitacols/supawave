import React, { useState, useEffect } from 'react';
import { Badge } from './ui/Badge';
import { CloudIcon, WifiIcon } from '@heroicons/react/24/outline';

const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending offline data
    const pending = localStorage.getItem('pendingSync');
    if (pending) {
      setPendingSync(JSON.parse(pending).length);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingData = async () => {
    const pending = localStorage.getItem('pendingSync');
    if (pending) {
      // Simulate sync process
      setTimeout(() => {
        localStorage.removeItem('pendingSync');
        setPendingSync(0);
      }, 2000);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {isOnline ? (
        <Badge variant="success" className="flex items-center">
          <CloudIcon className="h-3 w-3 mr-1" />
          Online
          {pendingSync > 0 && ` (Syncing ${pendingSync})`}
        </Badge>
      ) : (
        <Badge variant="warning" className="flex items-center">
          <WifiIcon className="h-3 w-3 mr-1" />
          Offline Mode
        </Badge>
      )}
    </div>
  );
};

export default OfflineSync;