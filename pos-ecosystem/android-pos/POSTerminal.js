import LocalDatabase from '../offline-sync/localDatabase.js';
import SyncManager from '../offline-sync/syncManager.js';
import ReceiptPrinter from '../hardware-integration/receiptPrinter.js';
import BarcodeScanner from '../hardware-integration/barcodeScanner.js';

class POSTerminal {
  constructor() {
    this.db = new LocalDatabase();
    this.syncManager = new SyncManager();
    this.printer = new ReceiptPrinter();
    this.scanner = new BarcodeScanner();
    
    this.currentSale = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      customer: null
    };
    
    this.business = JSON.parse(localStorage.getItem('business')) || {};
    this.cashier = JSON.parse(localStorage.getItem('user')) || {};
    
    this.init();
  }

  async init() {
    await this.db.init();
    this.syncManager.loadQueueFromStorage();
    
    // Load products from local database
    this.products = await this.db.getAll('products');
    
    console.log('🏪 POS Terminal initialized');
    console.log(`📦 ${this.products.length} products loaded`);
    console.log(`🔄 ${this.syncManager.getSyncStatus().pendingSync} items pending sync`);
  }

  // Add item to current sale
  async addItemToSale(barcode, quantity = 1) {
    const product = await this.db.getProductByBarcode(barcode);
    
    if (!product) {
      throw new Error(`Product not found: ${barcode}`);
    }
    
    if (product.stock_quantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock_quantity}`);
    }
    
    // Check if item already in sale
    const existingItem = this.currentSale.items.find(item => item.product_id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * existingItem.unit_price;
    } else {
      this.currentSale.items.push({
        product_id: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: quantity,
        unit_price: parseFloat(product.selling_price),
        total: quantity * parseFloat(product.selling_price)
      });
    }
    
    this.calculateTotals();
    return this.currentSale;
  }

  // Remove item from sale
  removeItemFromSale(productId) {
    this.currentSale.items = this.currentSale.items.filter(
      item => item.product_id !== productId
    );
    this.calculateTotals();
    return this.currentSale;
  }

  // Update item quantity
  updateItemQuantity(productId, newQuantity) {
    const item = this.currentSale.items.find(item => item.product_id === productId);
    if (item) {
      item.quantity = newQuantity;
      item.total = newQuantity * item.unit_price;
      this.calculateTotals();
    }
    return this.currentSale;
  }

  // Calculate sale totals
  calculateTotals() {
    this.currentSale.subtotal = this.currentSale.items.reduce(
      (sum, item) => sum + item.total, 0
    );
    
    // Simple tax calculation (5% VAT)
    this.currentSale.tax = this.currentSale.subtotal * 0.05;
    this.currentSale.total = this.currentSale.subtotal + this.currentSale.tax;
  }

  // Process payment and complete sale
  async completeSale(paymentMethod = 'cash', customerPhone = null) {
    if (this.currentSale.items.length === 0) {
      throw new Error('No items in sale');
    }

    const sale = {
      id: Date.now(),
      items: [...this.currentSale.items],
      subtotal: this.currentSale.subtotal,
      tax: this.currentSale.tax,
      total_amount: this.currentSale.total,
      payment_method: paymentMethod,
      customer_phone: customerPhone,
      cashier_id: this.cashier.id,
      timestamp: new Date().toISOString(),
      business_id: this.business.id
    };

    try {
      // Save sale locally
      await this.db.addSale(sale);
      
      // Update product stock locally
      for (const item of sale.items) {
        const product = await this.db.get('products', item.product_id);
        if (product) {
          await this.db.updateProductStock(
            item.product_id, 
            product.stock_quantity - item.quantity
          );
        }
      }
      
      // Queue for sync
      this.syncManager.queueSync('sale', sale);
      
      // Print receipt
      const receiptContent = this.printer.generateReceipt(sale, this.business);
      await this.printer.printReceipt(receiptContent);
      
      // Clear current sale
      this.clearSale();
      
      return {
        success: true,
        sale,
        message: 'Sale completed successfully'
      };
      
    } catch (error) {
      throw new Error(`Sale failed: ${error.message}`);
    }
  }

  // Clear current sale
  clearSale() {
    this.currentSale = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      customer: null
    };
  }

  // Start barcode scanning
  async startScanning() {
    return this.scanner.startScan((barcode) => {
      this.addItemToSale(barcode, 1);
    });
  }

  // Stop barcode scanning
  stopScanning() {
    this.scanner.stopScan();
  }

  // Get today's sales summary
  async getTodaysSummary() {
    const todaysSales = await this.db.getTodaysSales();
    
    return {
      totalSales: todaysSales.length,
      totalRevenue: todaysSales.reduce((sum, sale) => sum + sale.total_amount, 0),
      averageSale: todaysSales.length > 0 
        ? todaysSales.reduce((sum, sale) => sum + sale.total_amount, 0) / todaysSales.length 
        : 0,
      lastSale: todaysSales[todaysSales.length - 1] || null
    };
  }

  // Get system status
  getSystemStatus() {
    return {
      pos: {
        currentSale: this.currentSale,
        productsLoaded: this.products.length
      },
      sync: this.syncManager.getSyncStatus(),
      printer: this.printer.getPrinterStatus(),
      scanner: this.scanner.getScannerStatus(),
      business: this.business.name || 'Unknown',
      cashier: this.cashier.first_name || 'Unknown'
    };
  }

  // Manual sync trigger
  async forcSync() {
    return this.syncManager.processSyncQueue();
  }
}

export default POSTerminal;