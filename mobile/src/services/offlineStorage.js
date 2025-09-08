import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PRODUCTS: 'offline_products',
  SALES: 'offline_sales',
  PENDING_SYNC: 'pending_sync',
  LAST_SYNC: 'last_sync'
};

export const offlineStorage = {
  // Products
  saveProducts: async (products) => {
    await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getProducts: async () => {
    const data = await AsyncStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },

  // Sales
  saveSale: async (sale) => {
    const sales = await offlineStorage.getSales();
    const newSale = { ...sale, id: Date.now(), offline: true };
    sales.push(newSale);
    await AsyncStorage.setItem(KEYS.SALES, JSON.stringify(sales));
    
    // Add to pending sync
    const pending = await offlineStorage.getPendingSync();
    pending.sales.push(newSale);
    await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(pending));
    
    return newSale;
  },

  // Customers
  saveCustomer: async (customer) => {
    const customers = await offlineStorage.getCustomers();
    customers.push(customer);
    await AsyncStorage.setItem('customers', JSON.stringify(customers));
  },

  getCustomers: async () => {
    const data = await AsyncStorage.getItem('customers');
    return data ? JSON.parse(data) : [];
  },

  updateCustomer: async (customerId, updates) => {
    const customers = await offlineStorage.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updates };
      await AsyncStorage.setItem('customers', JSON.stringify(customers));
    }
  },

  getSales: async () => {
    const data = await AsyncStorage.getItem(KEYS.SALES);
    return data ? JSON.parse(data) : [];
  },

  // Pending sync
  getPendingSync: async () => {
    const data = await AsyncStorage.getItem(KEYS.PENDING_SYNC);
    return data ? JSON.parse(data) : { sales: [], products: [] };
  },

  clearPendingSync: async () => {
    await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify({ sales: [], products: [] }));
  },

  // Sync status
  setLastSync: async () => {
    await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  },

  getLastSync: async () => {
    return await AsyncStorage.getItem(KEYS.LAST_SYNC);
  }
};