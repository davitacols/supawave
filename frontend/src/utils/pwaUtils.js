// PWA Camera Permission Utils
export const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment' // Use back camera
      } 
    });
    
    // Stop the stream immediately, we just needed permission
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
};

export const isCameraSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

export const installPWA = () => {
  // This will be set by the beforeinstallprompt event
  if (window.deferredPrompt) {
    window.deferredPrompt.prompt();
    window.deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      }
      window.deferredPrompt = null;
    });
  }
};