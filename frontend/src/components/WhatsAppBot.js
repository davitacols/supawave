import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const WhatsAppBot = () => {
  const [botCommands, setBotCommands] = useState([
    { command: 'menu', response: 'Here are our available products:\n{product_list}' },
    { command: 'order', response: 'To place an order, reply with:\nORDER [product] [quantity]' },
    { command: 'status', response: 'Your order status: {order_status}' },
    { command: 'help', response: 'Available commands:\n• MENU - View products\n• ORDER - Place order\n• STATUS - Check order\n• CONTACT - Get support' }
  ]);

  const [newCommand, setNewCommand] = useState({ command: '', response: '' });

  const addCommand = () => {
    if (newCommand.command && newCommand.response) {
      setBotCommands([...botCommands, newCommand]);
      setNewCommand({ command: '', response: '' });
    }
  };

  const sampleConversation = [
    { sender: 'customer', message: 'Hi' },
    { sender: 'bot', message: '👋 Welcome to SupaWave Store!\n\nType MENU to see products or HELP for commands.' },
    { sender: 'customer', message: 'MENU' },
    { sender: 'bot', message: '📦 *AVAILABLE PRODUCTS:*\n\n1. Coca Cola - ₦200\n2. Bread - ₦300\n3. Rice (1kg) - ₦800\n\nTo order: ORDER [product] [quantity]' },
    { sender: 'customer', message: 'ORDER Coca Cola 3' },
    { sender: 'bot', message: '✅ Order confirmed!\n\n• Coca Cola x3 = ₦600\n\nReply with your address for delivery.' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold">WhatsApp Bot Configuration</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Commands */}
        <div>
          <h4 className="font-medium mb-4 flex items-center">
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Bot Commands
          </h4>
          
          <div className="space-y-3 mb-4">
            {botCommands.map((cmd, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md">
                <div className="font-medium text-sm text-green-600">/{cmd.command}</div>
                <div className="text-sm text-gray-600 mt-1">{cmd.response}</div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h5 className="font-medium mb-2">Add New Command</h5>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Command (e.g., price)"
                value={newCommand.command}
                onChange={(e) => setNewCommand({...newCommand, command: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <textarea
                placeholder="Response message"
                value={newCommand.response}
                onChange={(e) => setNewCommand({...newCommand, response: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
              />
              <button
                onClick={addCommand}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Add Command
              </button>
            </div>
          </div>
        </div>

        {/* Sample Conversation */}
        <div>
          <h4 className="font-medium mb-4">Sample Conversation</h4>
          <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto">
            {sampleConversation.map((msg, index) => (
              <div key={index} className={`mb-3 ${msg.sender === 'customer' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-xs p-2 rounded-lg text-sm ${
                  msg.sender === 'customer' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-md">
            <p className="text-sm text-green-700">
              💡 <strong>Tip:</strong> Customers can order directly by sending messages like "ORDER Coca Cola 2" to your WhatsApp Business number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBot;