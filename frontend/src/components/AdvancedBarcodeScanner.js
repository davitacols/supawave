import React, { useState, useRef, useEffect } from 'react';
import { QrCodeIcon, XMarkIcon, CameraIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { inventoryAPI } from '../utils/api';

const AdvancedBarcodeScanner = ({ onScan, onClose, onAddToCart }) => {
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [lastScanned, setLastScanned] = useState([]);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [scanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraError(false);
        
        // Start scanning loop
        scanLoop();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanLoop = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // In a real implementation, you would use a barcode scanning library here
      // For now, we'll simulate scanning
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      // processImageData(imageData);
    }
    
    requestAnimationFrame(scanLoop);
  };

  const handleManualScan = async () => {
    if (!manualBarcode.trim()) return;
    
    try {
      const response = await inventoryAPI.barcodeSearch(manualBarcode);
      if (response.data.found) {
        const product = response.data.product;
        setLastScanned(prev => [
          { barcode: manualBarcode, product, timestamp: new Date() },
          ...prev.slice(0, 4)
        ]);
        
        if (onAddToCart) {
          onAddToCart(product);
        }
        
        if (onScan) {
          onScan(manualBarcode, product);
        }
        
        setManualBarcode('');
      } else {
        alert('Product not found');
      }
    } catch (error) {
      console.error('Barcode search error:', error);
      alert('Error searching for product');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualScan();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <QrCodeIcon className="h-5 w-5 mr-2 text-blue-600" />
            Barcode Scanner
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Scanner */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CameraIcon className="h-5 w-5 mr-2 text-green-600" />
                  Camera Scanner
                </h4>
                <button
                  onClick={() => setScanning(!scanning)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    scanning
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {scanning ? 'Stop Camera' : 'Start Camera'}
                </button>
              </div>

              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {scanning && !cameraError ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-green-400 w-64 h-32 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 animate-pulse"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    {cameraError ? (
                      <div className="text-center">
                        <XMarkIcon className="h-16 w-16 mx-auto mb-4 text-red-400" />
                        <p className="text-lg">Camera access denied</p>
                        <p className="text-sm text-gray-400">Please allow camera access and try again</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <CameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg">Camera not active</p>
                        <p className="text-sm text-gray-400">Click "Start Camera" to begin scanning</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Manual Entry & History */}
            <div className="space-y-4">
              {/* Manual Entry */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Manual Entry
                </h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter barcode manually..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    onClick={handleManualScan}
                    disabled={!manualBarcode.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Scan History */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lastScanned.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No recent scans
                    </div>
                  ) : (
                    lastScanned.map((scan, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                        onClick={() => onAddToCart && onAddToCart(scan.product)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-sm text-gray-900">
                              {scan.product.name}
                            </h5>
                            <p className="text-xs text-gray-500">
                              Barcode: {scan.barcode}
                            </p>
                            <p className="text-xs text-gray-400">
                              {scan.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-blue-600">
                              ₦{scan.product.selling_price?.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {scan.product.stock_quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">Instructions:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Point camera at barcode and wait for automatic detection</li>
              <li>• Use manual entry if camera scanning fails</li>
              <li>• Click on recent scans to add them to cart again</li>
              <li>• Press Enter in manual entry field to search</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedBarcodeScanner;