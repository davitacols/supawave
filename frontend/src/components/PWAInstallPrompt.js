import React, { useState, useEffect } from 'react';
import { installPWA, isPWA } from '../utils/pwaUtils';

const PWAInstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      
      // Show install prompt if not already installed
      if (!isPWA()) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    installPWA();
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already dismissed this session
  if (sessionStorage.getItem('pwa-install-dismissed') || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install SupaWave</h3>
          <p className="text-xs mt-1 opacity-90">
            Install our app for faster access and better camera scanning!
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
      
      <div className="flex space-x-2 mt-3">
        <button
          onClick={handleInstall}
          className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-white opacity-70 hover:opacity-100 text-sm"
        >
          Not now
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;