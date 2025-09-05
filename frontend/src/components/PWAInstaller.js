import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { DevicePhoneMobileIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showInstallPrompt || localStorage.getItem('pwa-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:max-w-md md:left-auto">
      <div className="flex items-start space-x-3">
        <DevicePhoneMobileIcon className="h-6 w-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold">Install SupaWave</h3>
          <p className="text-sm opacity-90">Add to your home screen for quick access</p>
          <div className="flex space-x-2 mt-2">
            <Button size="sm" variant="outline" onClick={handleInstall} className="text-white border-white hover:bg-white hover:text-blue-600">
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-white hover:bg-blue-700">
              Later
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-white hover:text-gray-200">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstaller;