import React, { useState, useEffect } from 'react';
import { PhoneIcon, ChatBubbleLeftRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { whatsappAPI } from '../utils/api';
import { useToast } from '../hooks/useToast';

const WhatsApp = () => {
  const [config, setConfig] = useState({ phone_number: '', api_token: '', is_active: false });
  const [templates, setTemplates] = useState([]);
  const [messages, setMessages] = useState([]);
  const [promotionData, setPromotionData] = useState({ phone_numbers: '', message: '' });
  const [loading, setLoading] = useState(false);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const configRes = await whatsappAPI.getIntegration();
      setConfig(configRes.data || { phone_number: '', is_active: false });
      
      const messagesRes = await whatsappAPI.getMessages();
      setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setConfig({ phone_number: '', api_token: '', is_active: false });
      setMessages([]);
    }
  };

  const handleConfigSave = async () => {
    try {
      setLoading(true);
      await whatsappAPI.updateIntegration(config);
      showToast('Configuration saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPromotion = async () => {
    const phoneNumbers = promotionData.phone_numbers.split('\n').filter(p => p.trim());
    
    if (!phoneNumbers.length || !promotionData.message.trim()) {
      showToast('Please enter phone numbers and message', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await whatsappAPI.sendMessage({
        phone_numbers: phoneNumbers,
        message: promotionData.message
      });
      showToast(response.data.message, 'success');
      setPromotionData({ phone_numbers: '', message: '' });
      fetchData();
    } catch (error) {
      showToast('Failed to send promotion', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
      <div className="bg-white  border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">WhatsApp Business</h1>
            <p className="text-sm text-gray-600">Automate customer communication via WhatsApp</p>
          </div>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 ">
            Coming Soon
          </span>
        </div>
        <div className="bg-blue-50 border border-blue-200 -md p-4">
          <p className="text-sm text-blue-700">
            📱 WhatsApp integration is currently in development. This demo shows the interface - real messaging will be available soon!
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white  border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Configuration</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 ">Demo Mode</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone Number</label>
            <input
              type="text"
              value={config.phone_number}
              onChange={(e) => setConfig({...config, phone_number: e.target.value})}
              placeholder="+234XXXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 -md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp API Token</label>
            <input
              type="password"
              value={config.api_token}
              onChange={(e) => setConfig({...config, api_token: e.target.value})}
              placeholder="Enter your WhatsApp Business API token"
              className="w-full px-3 py-2 border border-gray-300 -md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.is_active}
              onChange={(e) => setConfig({...config, is_active: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Enable WhatsApp Integration</span>
          </label>
        </div>
        <button
          onClick={handleConfigSave}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-4 py-2 -md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Send Promotion */}
      <div className="bg-white  border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Send Promotion</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 ">Demo Mode</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Numbers (one per line)</label>
            <textarea
              value={promotionData.phone_numbers}
              onChange={(e) => setPromotionData({...promotionData, phone_numbers: e.target.value})}
              placeholder="+234XXXXXXXXXX&#10;+234XXXXXXXXXX"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 -md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={promotionData.message}
              onChange={(e) => setPromotionData({...promotionData, message: e.target.value})}
              placeholder="🎉 Special offer! Get 20% off all products today only..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 -md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSendPromotion}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 -md hover:bg-green-700 disabled:opacity-50"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-2" />
            {loading ? 'Sending...' : 'Send Promotion'}
          </button>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white  border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Messages</h2>
        <div className="space-y-3">
          {!Array.isArray(messages) || messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages sent yet</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex justify-between items-center p-3 border border-gray-200 -md">
                <div>
                  <p className="text-sm font-medium text-gray-900">{message.phone_number}</p>
                  <p className="text-sm text-gray-600">{message.message.substring(0, 50)}...</p>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-xs text-gray-500">{message.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default WhatsApp;
