import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const WhatsAppShare = ({ type, data, customerPhone }) => {
  const generateMessage = () => {
    switch (type) {
      case 'receipt':
        return `🧾 *RECEIPT - ${data.business_name}*\n\n` +
               `📅 Date: ${new Date(data.date).toLocaleDateString()}\n` +
               `🆔 Sale ID: #${data.id}\n\n` +
               `📦 *ITEMS:*\n${data.items.map(item => 
                 `• ${item.name} x${item.quantity} - ₦${(item.price * item.quantity).toLocaleString()}`
               ).join('\n')}\n\n` +
               `💰 *Total: ₦${data.total.toLocaleString()}*\n\n` +
               `Thank you for shopping with us! 🙏`;

      case 'low_stock':
        return `⚠️ *LOW STOCK ALERT*\n\n` +
               `📦 Product: ${data.name}\n` +
               `📊 Current Stock: ${data.stock}\n` +
               `🔔 Threshold: ${data.threshold}\n\n` +
               `Please restock soon!`;

      case 'order_confirmation':
        return `✅ *ORDER CONFIRMED*\n\n` +
               `Hi ${data.customer_name}!\n\n` +
               `Your order has been received:\n${data.items.map(item => 
                 `• ${item.name} x${item.quantity}`
               ).join('\n')}\n\n` +
               `💰 Total: ₦${data.total.toLocaleString()}\n` +
               `🕐 Ready in: ${data.prep_time || '15 minutes'}\n\n` +
               `We'll notify you when ready! 📱`;

      default:
        return 'Hello from SupaWave! 👋';
    }
  };

  const sendWhatsApp = async () => {
    const message = generateMessage();
    const phone = customerPhone || '';
    
    try {
      // Try API first
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ to: phone, message })
      });
      
      if (!response.ok) {
        throw new Error('API failed');
      }
    } catch (error) {
      // Fallback to WhatsApp Web
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <button
      onClick={sendWhatsApp}
      className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
    >
      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
      Send via WhatsApp
    </button>
  );
};

export default WhatsAppShare;