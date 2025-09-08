import React, { useState, useEffect } from 'react';
import { 
  LightBulbIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const AICoach = () => {
  const [insights, setInsights] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');

  useEffect(() => {
    fetchInsights();
    fetchMarketData();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await api.get('/ai/insights/');
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const fetchMarketData = async () => {
    try {
      const response = await api.get('/ai/market-intelligence/');
      setMarketData(response.data.market_data || []);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/insights/generate/');
      setInsights(response.data.insights);
      alert(`Generated ${response.data.insights.length} new insights!`);
    } catch (error) {
      console.error('Error generating insights:', error);
      alert('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const askCoach = async () => {
    if (!chatQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await api.post('/ai/coach/ask/', {
        query: chatQuery,
        language: 'en'
      });
      setChatResponse(response.data.response);
    } catch (error) {
      console.error('Error asking coach:', error);
      setChatResponse('Sorry, I cannot answer right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const dismissInsight = async (insightId) => {
    try {
      await api.post(`/ai/insights/${insightId}/dismiss/`);
      setInsights(insights.filter(insight => insight.id !== insightId));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'pricing': return <ChartBarIcon className="h-5 w-5" />;
      case 'inventory': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'opportunity': return <LightBulbIcon className="h-5 w-5" />;
      default: return <CheckCircleIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI Business Coach</h1>
          <p className="text-gray-600">Get personalized insights and advice for your business</p>
        </div>
        <Button onClick={generateInsights} disabled={loading} className="flex items-center space-x-2">
          <LightBulbIcon className="h-4 w-4" />
          <span>{loading ? 'Analyzing...' : 'Generate Insights'}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'insights', name: 'Business Insights', count: insights.length },
            { id: 'chat', name: 'Ask Coach' },
            { id: 'market', name: 'Market Intelligence', count: marketData.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Business Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <Card className="text-center py-12">
              <LightBulbIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Yet</h3>
              <p className="text-gray-600 mb-4">Click "Generate Insights" to get AI-powered business recommendations</p>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card key={insight.id} className={`p-6 border-l-4 ${getPriorityColor(insight.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getInsightIcon(insight.insight_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{insight.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Type: {insight.insight_type}</span>
                        <span>Confidence: {Math.round(insight.confidence_score * 100)}%</span>
                        <span>{new Date(insight.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissInsight(insight.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask Your AI Business Coach</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to know about your business?
                </label>
                <textarea
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  placeholder="e.g., How should I price my rice? What products should I stock more of?"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button 
                onClick={askCoach} 
                disabled={loading || !chatQuery.trim()}
                className="flex items-center space-x-2"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>{loading ? 'Thinking...' : 'Ask Coach'}</span>
              </Button>
            </div>
          </Card>

          {chatResponse && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">AI Coach Response:</h4>
                  <p className="text-blue-800">{chatResponse}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Questions */}
          <Card className="p-6">
            <h4 className="font-medium text-gray-900 mb-3">Quick Questions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "How should I price my products?",
                "What should I reorder next?",
                "How can I increase profits?",
                "Which products sell best?"
              ].map((question) => (
                <button
                  key={question}
                  onClick={() => setChatQuery(question)}
                  className="text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                >
                  {question}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Market Intelligence Tab */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          {marketData.length === 0 ? (
            <Card className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Market Data Available</h3>
              <p className="text-gray-600">Market intelligence will appear here as marketplace data is collected</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketData.map((item, index) => (
                <Card key={index} className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{item.your_product}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Average:</span>
                      <span className="font-medium">₦{item.avg_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price Range:</span>
                      <span>₦{item.min_price} - ₦{item.max_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sample Size:</span>
                      <span>{item.sample_size} stores</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trend:</span>
                      <span className={`capitalize ${
                        item.price_trend === 'rising' ? 'text-red-600' : 
                        item.price_trend === 'falling' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {item.price_trend}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AICoach;