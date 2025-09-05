class OfflineSyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    this.lastSync = localStorage.getItem('lastSync');
    
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  handleOnline() {
    this.isOnline = true;
    this.syncData();
  }

  handleOffline() {
    this.isOnline = false;
  }

  addToQueue(endpoint, method, data) {
    const item = {
      id: Date.now(),
      endpoint,
      method,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.syncQueue.push(item);
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    
    if (this.isOnline) {
      this.syncData();
    }
  }

  async syncData() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    try {
      const response = await fetch('/api/sync/upload/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ queue: this.syncQueue })
      });

      if (response.ok) {
        this.syncQueue = [];
        localStorage.setItem('syncQueue', '[]');
        localStorage.setItem('lastSync', new Date().toISOString());
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  async getOfflineData() {
    const products = JSON.parse(localStorage.getItem('offlineProducts') || '[]');
    const sales = JSON.parse(localStorage.getItem('offlineSales') || '[]');
    return { products, sales };
  }

  saveOfflineData(type, data) {
    localStorage.setItem(`offline${type}`, JSON.stringify(data));
  }
}

export default new OfflineSyncService();