import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from '../services/offlineStorage';
import { inventoryAPI, salesAPI } from '../services/api';

const OfflineContext = createContext();

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false); // Start offline by default
  const [pendingSync, setPendingSync] = useState({ sales: [], products: [] });

  useEffect(() => {
    // Check initial network state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected);
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        syncPendingData();
      }
    });

    loadPendingSync();
    return unsubscribe;
  }, []);

  const loadPendingSync = async () => {
    const pending = await offlineStorage.getPendingSync();
    setPendingSync(pending);
  };

  const syncPendingData = async () => {
    try {
      const pending = await offlineStorage.getPendingSync();
      
      // Sync pending sales
      for (const sale of pending.sales) {
        await salesAPI.createSale(sale);
      }
      
      // Clear pending data
      await offlineStorage.clearPendingSync();
      await offlineStorage.setLastSync();
      setPendingSync({ sales: [], products: [] });
      
      console.log('Sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const saveOfflineSale = async (saleData) => {
    return await offlineStorage.saveSale(saleData);
  };

  return (
    <OfflineContext.Provider value={{
      isOnline,
      pendingSync,
      saveOfflineSale,
      syncPendingData
    }}>
      {children}
    </OfflineContext.Provider>
  );
};