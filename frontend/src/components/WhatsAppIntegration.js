import React, { useState } from 'react';
import { PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const WhatsAppIntegration = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const connectWhatsApp = async () => {
    if (whatsappNumber) {
      try {
        // Save WhatsApp number to backend
        const response = await fetch('/api/whatsapp/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({ phone_number: whatsappNumber })
        });
        
        if (response.ok) {
          setIsConnected(true);
          alert('WhatsApp connected successfully!');
        } else {
          alert('Failed to connect WhatsApp');
        }
      } catch (error) {
        console.error('WhatsApp connection error:', error);
        alert('Connection failed. Please try again.');
      }
    }
  };

  const sendTestMessage = async () => {
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          to: whatsappNumber,
          message: "🛒 *SupaWave Store* - Test message from your inventory system!\n\nWhatsApp integration is working perfectly!"
        })
      });
      
      if (response.ok) {
        alert('Test message sent successfully!');
      } else {
        // Fallback to WhatsApp Web
        const message = "🛒 *SupaWave Store* - Test message from your inventory system!\n\nWhatsApp integration is working!";
        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Send message error:', error);
      // Fallback to WhatsApp Web
      const message = "🛒 *SupaWave Store* - Test message!";
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold">WhatsApp Business Integration</h3>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Business Number
            </label>
            <input
              type="tel"
              placeholder="+234XXXXXXXXXX"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={connectWhatsApp}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Connect WhatsApp Business
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center text-green-600">
            <PhoneIcon className="h-5 w-5 mr-2" />
            <span>Connected: {whatsappNumber}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={sendTestMessage}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Send Test Receipt
            </button>
            <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm">
              Setup Bot Commands
            </button>
          </div>

          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="font-medium text-green-800 mb-2">Available Features:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ Customer ordering via WhatsApp</li>
              <li>✅ Automatic receipt delivery</li>
              <li>✅ Low stock notifications</li>
              <li>✅ Customer support integration</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppIntegration;