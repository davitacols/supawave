import React, { useState, useEffect } from 'react';
import { storesAPI, authAPI } from '../utils/api';

const StoreSelector = ({ user, onStoreChange }) => {
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.accessible_stores) {
      setStores(user.accessible_stores);
      const current = user.accessible_stores.find(s => s.id === user.current_store_id);
      setCurrentStore(current);
    }
  }, [user]);

  const handleStoreSwitch = async (storeId) => {
    try {
      await storesAPI.switchStore(storeId);
      const newStore = stores.find(s => s.id === storeId);
      setCurrentStore(newStore);
      setIsOpen(false);
      
      // Refresh user context
      const userResponse = await authAPI.getCurrentUser();
      onStoreChange(userResponse.data);
    } catch (error) {
      console.error('Error switching store:', error);
      alert('Failed to switch store');
    }
  };

  if (!stores.length || user?.role === 'owner') {
    return null; // Don't show selector for owners or users with no stores
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium">
          {currentStore?.name || 'Select Store'}
        </span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
              Available Stores
            </div>
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => handleStoreSwitch(store.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                  currentStore?.id === store.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div>
                  <div className="font-medium">{store.name}</div>
                  {store.is_main_store && (
                    <div className="text-xs text-gray-500">Main Store</div>
                  )}
                </div>
                {currentStore?.id === store.id && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreSelector;