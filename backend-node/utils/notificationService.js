const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class NotificationService {
  static async createNotification(businessId, type, title, message, data = null, priority = 'medium', userId = null) {
    try {
      await pool.query(`
        INSERT INTO notifications (business_id, user_id, type, title, message, data, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [businessId, userId, type, title, message, JSON.stringify(data), priority]);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  static async createLowStockNotification(businessId, productName, currentStock, threshold) {
    await this.createNotification(
      businessId,
      'low_stock',
      'Low Stock Alert',
      `${productName} is running low (${currentStock} remaining)`,
      { product_name: productName, current_stock: currentStock, threshold },
      'high'
    );
  }

  static async createSaleNotification(businessId, saleAmount, customerName = null) {
    await this.createNotification(
      businessId,
      'sale',
      'New Sale',
      `Sale completed: ₦${saleAmount.toLocaleString()}${customerName ? ` for ${customerName}` : ''}`,
      { amount: saleAmount, customer: customerName },
      'medium'
    );
  }

  static async createPaymentNotification(businessId, amount, type = 'received') {
    await this.createNotification(
      businessId,
      'payment',
      type === 'received' ? 'Payment Received' : 'Payment Due',
      `Payment ${type}: ₦${amount.toLocaleString()}`,
      { amount, type },
      type === 'due' ? 'high' : 'medium'
    );
  }

  static async createInventoryNotification(businessId, action, productName, quantity) {
    await this.createNotification(
      businessId,
      'inventory',
      'Inventory Update',
      `${productName}: ${action} ${quantity} units`,
      { product_name: productName, action, quantity },
      'low'
    );
  }

  static async createTransferNotification(businessId, fromStore, toStore, status) {
    await this.createNotification(
      businessId,
      'transfer',
      'Transfer Update',
      `Transfer from ${fromStore} to ${toStore} is ${status}`,
      { from_store: fromStore, to_store: toStore, status },
      'medium'
    );
  }

  static async createSystemNotification(businessId, title, message, priority = 'medium') {
    await this.createNotification(
      businessId,
      'system',
      title,
      message,
      null,
      priority
    );
  }
}

module.exports = NotificationService;