class SyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.lastSync = localStorage.getItem('lastSync') || null;
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  // Add transaction to sync queue
  queueSync(operation, data) {
    const syncItem = {
      id: Date.now(),
      operation, // 'sale', 'product_update', 'inventory_adjust'
      data,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    this.syncQueue.push(syncItem);
    this.saveQueueToStorage();
    
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // Process all pending sync items
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const unsynced = this.syncQueue.filter(item => !item.synced);
    
    for (const item of unsynced) {
      try {
        await this.syncItem(item);
        item.synced = true;
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
      }
    }
    
    this.saveQueueToStorage();
    this.lastSync = new Date().toISOString();
    localStorage.setItem('lastSync', this.lastSync);
  }

  // Sync individual item to server
  async syncItem(item) {
    const endpoints = {
      'sale': '/api/sales/',
      'product_update': '/api/inventory/products/',
      'inventory_adjust': '/api/inventory/adjust/'
    };

    const response = await fetch(endpoints[item.operation], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(item.data)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Handle online event
  handleOnline() {
    this.isOnline = true;
    console.log('📶 Back online - processing sync queue');
    this.processSyncQueue();
  }

  // Handle offline event
  handleOffline() {
    this.isOnline = false;
    console.log('📵 Gone offline - queuing operations');
  }

  // Save sync queue to localStorage
  saveQueueToStorage() {
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  // Load sync queue from localStorage
  loadQueueFromStorage() {
    const stored = localStorage.getItem('syncQueue');
    if (stored) {
      this.syncQueue = JSON.parse(stored);
    }
  }

  // Get sync status
  getSyncStatus() {
    const unsynced = this.syncQueue.filter(item => !item.synced).length;
    return {
      isOnline: this.isOnline,
      pendingSync: unsynced,
      lastSync: this.lastSync,
      totalQueued: this.syncQueue.length
    };
  }
}

export default SyncManager;