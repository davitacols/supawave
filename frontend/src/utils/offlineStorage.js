// Offline storage utilities
const STORAGE_KEYS = {
  PRODUCTS: 'offline_products',
  SALES: 'offline_sales',
  CATEGORIES: 'offline_categories',
  SUPPLIERS: 'offline_suppliers',
  PENDING_SYNC: 'pending_sync',
  LAST_SYNC: 'last_sync'
};

export const offlineStorage = {
  // Save data to localStorage
  saveProducts: (products) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getProducts: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error getting products from storage:', error);
      return [];
    }
  },

  saveCategories: (categories) => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getCategories: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error getting categories from storage:', error);
      return [];
    }
  },

  saveSuppliers: (suppliers) => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  },

  getSuppliers: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error getting suppliers from storage:', error);
      return [];
    }
  },

  // Save offline sales for later sync
  savePendingSale: (sale) => {
    const pending = offlineStorage.getPendingSales();
    pending.push({ ...sale, timestamp: Date.now(), id: `offline_${Date.now()}` });
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
  },

  getPendingSales: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error getting pending sales from storage:', error);
      return [];
    }
  },

  clearPendingSales: () => {
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify([]));
  },

  // Clear specific pending sale
  removePendingSale: (saleId) => {
    const pending = offlineStorage.getPendingSales();
    const filtered = pending.filter(sale => sale.id !== saleId);
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
  },

  // Check if online
  isOnline: () => navigator.onLine,

  // Update product stock locally
  updateProductStock: (productId, newStock) => {
    const products = offlineStorage.getProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      products[productIndex].stock_quantity = newStock;
      offlineStorage.saveProducts(products);
    }
  },

  // Sync pending sales
  syncPendingSales: async (salesAPI) => {
    const pendingSales = offlineStorage.getPendingSales();
    const syncResults = [];
    
    for (const sale of pendingSales) {
      try {
        // Clean up the sale data - remove offline-specific fields
        const cleanSale = {
          total_amount: sale.total_amount,
          items: sale.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        };
        
        await salesAPI.createSale(cleanSale);
        syncResults.push({ success: true, sale });
      } catch (error) {
        console.error('Sync error for sale:', sale, error);
        syncResults.push({ success: false, sale, error: error.message });
      }
    }
    
    // Clear successfully synced sales
    const failedSales = syncResults.filter(r => !r.success).map(r => r.sale);
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(failedSales));
    
    return syncResults;
  }
};

export default offlineStorage;