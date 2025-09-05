import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { BrowserMultiFormatReader } from '@zxing/library';
import MobileCameraHelp from './MobileCameraHelp';

const BarcodeScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const codeReader = useRef(new BrowserMultiFormatReader());

  useEffect(() => {
    startCamera();
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        stopCamera();
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      stopCamera();
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const startCamera = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      // Simple mobile-friendly camera request
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        setError(null);
        
        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          startBarcodeDetection();
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Camera access denied';
      let instructions = [];
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied';
        instructions = [
          '1. Tap the camera icon in your browser address bar',
          '2. Select "Allow" for camera access',
          '3. Refresh the page and try again'
        ];
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found';
        instructions = ['Please use a device with a camera'];
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMessage = 'Camera requires secure connection';
        instructions = ['Please use HTTPS or localhost'];
      } else {
        instructions = ['Try using manual barcode entry below'];
      }
      
      setError({ message: errorMessage, instructions });
    }
  };

  const stopCamera = () => {
    try {
      codeReader.current.reset();
    } catch (err) {
      console.error('Error stopping camera:', err);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const startBarcodeDetection = async () => {
    try {
      const result = await codeReader.current.decodeFromVideoDevice(
        undefined, // Use default video device
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log('Barcode detected:', result.getText());
            onScan(result.getText());
            stopCamera();
          }
          if (err && !(err.name === 'NotFoundException')) {
            console.error('Barcode detection error:', err);
          }
        }
      );
    } catch (err) {
      console.error('Failed to start barcode detection:', err);
    }
  };

  const handleManualInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      onScan(e.target.value.trim());
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      stopCamera();
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Barcode Scanner</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHelp(true)}
              className="text-gray-400 hover:text-gray-600"
              title="Camera Help"
            >
              <QuestionMarkCircleIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {error ? (
          <div className="text-center py-6">
            <div className="mb-4">
              <div className="text-red-600 mb-3 font-medium">{error.message}</div>
              {error.instructions && (
                <div className="text-sm text-gray-600 mb-4 text-left bg-gray-50 p-3 rounded">
                  <p className="font-medium mb-2">To enable camera:</p>
                  {error.instructions.map((instruction, index) => (
                    <p key={index} className="mb-1">{instruction}</p>
                  ))}
                </div>
              )}
              <button
                onClick={startCamera}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Try Camera Again
              </button>
            </div>
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm text-gray-600 font-medium">Or enter barcode manually:</p>
              <input
                type="text"
                placeholder="Scan or type barcode here..."
                className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                onKeyPress={handleManualInput}
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                webkit-playsinline="true"
                className="w-full h-64 object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-red-500 w-64 h-32 relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-0.5 bg-red-500 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Position the barcode within the red frame
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Or enter barcode manually below:
              </p>
              <input
                type="text"
                placeholder="Enter barcode and press Enter..."
                className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyPress={handleManualInput}
              />
              <div className="mt-2 text-center">
                <div className="flex justify-center space-x-4 text-xs text-gray-500 mb-2">
                  <span>📱 Camera</span>
                  <span>⌨️ Manual Input</span>
                  <span>🔌 USB Scanner</span>
                </div>
                <p className="text-xs text-gray-400">
                  📱 Mobile: Allow camera permission when prompted<br/>
                  🖥️ Desktop: Click allow in browser popup
                </p>
              </div>
            </div>
          </div>
        )}
        
        {showHelp && (
          <MobileCameraHelp onClose={() => setShowHelp(false)} />
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;