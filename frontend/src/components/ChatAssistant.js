import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const MessageContent = ({ content }) => {
  const formatContent = (text) => {
    const lines = text.split('\n');
    const formatted = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // AI indicator with enhanced styling
      if (trimmed.match(/^[🧠💡🤖]/)) {
        const [emoji, ...rest] = trimmed.split(' ');
        const isAI = emoji === '🧠';
        formatted.push(
          <div key={index} className={`flex items-center space-x-2 mb-4 p-2 rounded-lg ${
            isAI ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500' : 'bg-gray-50'
          }`}>
            <span className="text-xl">{emoji}</span>
            <div>
              <span className="font-semibold text-gray-900">{rest.join(' ')}</span>
              {isAI && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">AI Powered</span>}
            </div>
          </div>
        );
      }
      // Enhanced bullet points with icons
      else if (trimmed.startsWith('- ')) {
        const content = trimmed.substring(2);
        const hasMetric = content.match(/₦[\d,]+/);
        formatted.push(
          <div key={index} className="flex items-start space-x-3 mb-2 p-2 hover:bg-gray-50 rounded">
            <div className={`w-2 h-2 rounded-full mt-2 ${
              hasMetric ? 'bg-green-500' : 'bg-blue-500'
            }`}></div>
            <span className="text-sm text-gray-700 flex-1">{content}</span>
          </div>
        );
      }
      // Enhanced currency highlighting with badges
      else if (trimmed.match(/₦[\d,]+/)) {
        const highlighted = trimmed.replace(/(₦[\d,]+)/g, 
          '<span class="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800 mx-1">$1</span>'
        );
        formatted.push(
          <p key={index} className="text-sm text-gray-700 mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlighted }} />
        );
      }
      // Regular text with better spacing
      else if (trimmed) {
        formatted.push(
          <p key={index} className="text-sm text-gray-700 mb-2 leading-relaxed">{trimmed}</p>
        );
      }
    });
    
    return formatted;
  };
  
  return <div className="space-y-1">{formatContent(content)}</div>;
};

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '🧠 Hi! I\'m Supa, your business assistant.\n\nI can help you with:\n- Sales performance and revenue analysis\n- Inventory management and stock alerts\n- Customer insights and trends\n- Business recommendations and growth strategies\n\nWhat would you like to know about your business today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat/', {
        message: inputMessage,
        timestamp: new Date().toISOString()
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I\'m having trouble connecting to the AI service. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "How are my sales this week?",
    "Which products are low in stock?",
    "What are my top selling items?",
    "Show me revenue trends"
  ];

  return (
    <>
      {/* Enhanced Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group ${isOpen ? 'hidden' : 'block'}`}
      >
        <div className="relative">
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          <SparklesIcon className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
        </div>
        <div className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat with Supa
        </div>
      </button>

      {/* Enhanced Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold">Supa</h3>
                <p className="text-xs text-blue-100">Your Business Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Enhanced Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.type === 'ai' ? (
                    <div 
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
                      onClick={() => setInputMessage(message.content.replace(/[🧠💡🤖]/g, '').replace(/\n/g, ' ').trim())}
                      title="Click to respond to this message"
                    >
                      <div className="p-5">
                        <MessageContent content={message.content} />
                      </div>
                      <div className="px-5 pb-3 flex items-center justify-between text-xs text-gray-400 bg-gray-50 group-hover:bg-blue-50 transition-colors">
                        <span className="flex items-center space-x-1">
                          <SparklesIcon className="h-3 w-3" />
                          <span>Supa</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">• Click to respond</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl rounded-br-md shadow-lg">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs mt-2 text-blue-100">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 max-w-[90%]">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Supa is thinking...</span>
                      <p className="text-xs text-gray-500">Analyzing your business data</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Quick Questions */}
          {messages.length === 1 && (
            <div className="px-5 pb-4 bg-white border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick questions to get started:</p>
              <div className="grid grid-cols-1 gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="text-left text-sm text-gray-600 hover:text-blue-600 p-3 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-all duration-200 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Input */}
          <div className="p-5 bg-white border-t border-gray-100">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about sales, inventory, or get business insights..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                  disabled={isLoading}
                />
                {inputMessage && (
                  <button
                    onClick={() => setInputMessage('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;