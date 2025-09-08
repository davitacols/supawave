import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import WhatsAppIntegration from '../components/WhatsAppIntegration';
import WhatsAppBot from '../components/WhatsAppBot';

const WhatsAppSettings = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-2xl font-medium text-gray-900">WhatsApp Integration</h1>
            <p className="text-sm text-gray-600 mt-1">Connect your store with WhatsApp Business for seamless customer communication</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Integration Setup */}
        <WhatsAppIntegration />

        {/* Bot Configuration */}
        <WhatsAppBot />

        {/* Features Overview */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">WhatsApp Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-green-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Customer Ordering</h4>
                  <p className="text-sm text-gray-600">Customers can browse products and place orders directly via WhatsApp messages.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Instant Receipts</h4>
                  <p className="text-sm text-gray-600">Send formatted receipts directly to customer phones after each purchase.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Stock Alerts</h4>
                  <p className="text-sm text-gray-600">Get notified on WhatsApp when products are running low on stock.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-blue-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-medium">Customer Support</h4>
                  <p className="text-sm text-gray-600">Integrated support system for handling customer inquiries and complaints.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettings;