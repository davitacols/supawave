const NotificationService = require('./utils/notificationService');

async function testNotifications() {
  console.log('Testing notification system...');
  
  try {
    // Test creating different types of notifications
    await NotificationService.createLowStockNotification(1, 'Test Product', 5, 10);
    console.log('✅ Low stock notification created');
    
    await NotificationService.createSaleNotification(1, 15000, 'John Doe');
    console.log('✅ Sale notification created');
    
    await NotificationService.createSystemNotification(1, 'System Test', 'This is a test notification', 'medium');
    console.log('✅ System notification created');
    
    console.log('🎉 All notifications created successfully!');
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  }
}

testNotifications();