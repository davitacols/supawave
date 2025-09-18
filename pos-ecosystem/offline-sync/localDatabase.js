class LocalDatabase {
  constructor() {
    this.dbName = 'SupaWavePOS';
    this.version = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('barcode', 'barcode', { unique: true });
        }
        
        // Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('phone', 'phone', { unique: true });
        }
      };
    });
  }

  // Generic CRUD operations
  async add(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return store.add(data);
  }

  async get(storeName, id) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return store.put(data);
  }

  async delete(storeName, id) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return store.delete(id);
  }

  // Product-specific methods
  async addProduct(product) {
    return this.add('products', { ...product, lastUpdated: Date.now() });
  }

  async getProductByBarcode(barcode) {
    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const index = store.index('barcode');
    return new Promise((resolve, reject) => {
      const request = index.get(barcode);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProductStock(productId, newStock) {
    const product = await this.get('products', productId);
    if (product) {
      product.stock_quantity = newStock;
      product.lastUpdated = Date.now();
      return this.update('products', product);
    }
  }

  // Sales-specific methods
  async addSale(sale) {
    const saleData = {
      ...sale,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      synced: false
    };
    return this.add('sales', saleData);
  }

  async getTodaysSales() {
    const today = new Date().toDateString();
    const allSales = await this.getAll('sales');
    return allSales.filter(sale => 
      new Date(sale.timestamp).toDateString() === today
    );
  }

  // Sync data from server
  async syncFromServer(products, customers) {
    // Clear and repopulate products
    const productTransaction = this.db.transaction(['products'], 'readwrite');
    const productStore = productTransaction.objectStore('products');
    await productStore.clear();
    
    for (const product of products) {
      await productStore.add({ ...product, lastUpdated: Date.now() });
    }

    // Update customers
    const customerTransaction = this.db.transaction(['customers'], 'readwrite');
    const customerStore = customerTransaction.objectStore('customers');
    
    for (const customer of customers) {
      await customerStore.put({ ...customer, lastUpdated: Date.now() });
    }
  }
}

export default LocalDatabase;