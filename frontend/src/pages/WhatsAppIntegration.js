import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, CheckCircleIcon, XCircleIcon, PhoneIcon } from '@heroicons/react/24/outline';

const WhatsAppIntegration = () => {
  const [config, setConfig] = useState({
    phone_number: '',
    is_active: false,
    auto_send_receipts: true,
    auto_low_stock_alerts: true
  });
  const [messages, setMessages] = useState([]);
  const [testPhone, setTestPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchMessages();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/whatsapp-integration/config/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/whatsapp-integration/messages/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp-integration/config/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Configuration saved successfully!');
      } else {
        alert('Error saving configuration');
      }
    } catch (error) {
      alert('Error saving configuration');
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone) {
      alert('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp-integration/test/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone_number: testPhone })
      });
      
      if (response.ok) {
        alert('Test message sent successfully!');
        setTestPhone('');
        fetchMessages();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Error sending test message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900 mt-4">WhatsApp Business Integration</h1>
        <p className="text-gray-600 mt-2">Automate customer communication and boost sales</p>
      </div>

      {/* Configuration */}
      <div className="bg-white p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Phone Number
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                placeholder="+234XXXXXXXXXX"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={config.phone_number}
                onChange={(e) => setConfig({...config, phone_number: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              checked={config.is_active}
              onChange={(e) => setConfig({...config, is_active: e.target.checked})}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Enable WhatsApp Integration
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="auto_receipts"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              checked={config.auto_send_receipts}
              onChange={(e) => setConfig({...config, auto_send_receipts: e.target.checked})}
            />
            <label htmlFor="auto_receipts" className="text-sm font-medium text-gray-700">
              Auto-send receipts to customers
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="auto_alerts"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              checked={config.auto_low_stock_alerts}
              onChange={(e) => setConfig({...config, auto_low_stock_alerts: e.target.checked})}
            />
            <label htmlFor="auto_alerts" className="text-sm font-medium text-gray-700">
              Auto-send low stock alerts to suppliers
            </label>
          </div>

          <button
            onClick={saveConfig}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Test Message */}
      <div className="bg-white p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Test WhatsApp Message</h2>
        
        <div className="flex space-x-4">
          <input
            type="tel"
            placeholder="Enter phone number (+234XXXXXXXXXX)"
            className="flex-1 px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
          <button
            onClick={sendTestMessage}
            disabled={loading || !config.is_active}
            className="bg-green-600 text-white px-6 py-2 hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Test'}
          </button>
        </div>
        
        {!config.is_active && (
          <p className="text-sm text-red-600 mt-2">
            Please enable WhatsApp integration first
          </p>
        )}
      </div>

      {/* Message History */}
      <div className="bg-white p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
        
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages sent yet</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-center justify-between p-3 bg-gray-50 border">
                <div>
                  <p className="font-medium text-gray-900">{message.recipient_phone}</p>
                  <p className="text-sm text-gray-600 capitalize">{message.message_type}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center">
                  {message.status === 'sent' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                  <span className="ml-2 text-sm capitalize">{message.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Create a WhatsApp Business account</li>
          <li>Get your WhatsApp Business API credentials</li>
          <li>Add credentials to your environment variables</li>
          <li>Configure your business phone number above</li>
          <li>Enable the integration and test messaging</li>
        </ol>
      </div>
    </div>
  );
};

export default WhatsAppIntegration;