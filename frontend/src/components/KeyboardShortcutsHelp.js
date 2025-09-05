import React from 'react';
import { XMarkIcon, CommandLineIcon } from '@heroicons/react/24/outline';

const KeyboardShortcutsHelp = ({ isOpen, onClose, shortcuts }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CommandLineIcon className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700">{description}</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          Press ? to toggle this help
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;