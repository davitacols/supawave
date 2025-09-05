import React from 'react';

const MobileCameraHelp = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4 text-center">Enable Camera Access</h3>
        
        <div className="space-y-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <p className="font-medium text-blue-800 mb-2">📱 On Mobile:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Look for camera icon in address bar</li>
              <li>Tap it and select "Allow"</li>
              <li>Refresh page if needed</li>
            </ol>
          </div>
          
          <div className="bg-green-50 p-3 rounded">
            <p className="font-medium text-green-800 mb-2">🖥️ On Desktop:</p>
            <ol className="list-decimal list-inside space-y-1 text-green-700">
              <li>Click "Allow" in browser popup</li>
              <li>Check browser settings if blocked</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-medium text-gray-800 mb-2">⚠️ Still not working?</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Close other camera apps</li>
              <li>Try a different browser</li>
              <li>Use manual barcode entry</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileCameraHelp;