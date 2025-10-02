import React, { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  const [selectedStore, setSelectedStore] = useState(null);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/stores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Store context API error:', response.status);
        return;
      }
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        setStores([]);
        return;
      }
      
      let data;
      try {
        data = JSON.parse(text);
        setStores(Array.isArray(data) ? data : []);
      } catch (parseError) {
        console.error('Store context JSON parse error:', parseError, 'Response text:', text.substring(0, 100));
        setStores([]);
        return;
      }
      
      // Auto-select main store or first store
      if (data && data.length > 0 && !selectedStore) {
        const mainStore = data.find(s => s.is_main_store) || data[0];
        setSelectedStore(mainStore);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    }
  };

  // Expose refresh function globally
  useEffect(() => {
    window.refreshStores = fetchStores;
    return () => {
      delete window.refreshStores;
    };
  }, []);

  const value = {
    selectedStore,
    setSelectedStore,
    stores,
    fetchStores
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContext;