import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  CurrencyDollarIcon, ShoppingBagIcon, ArchiveBoxIcon, UsersIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon,
  ChartBarIcon, ClockIcon, ServerIcon, CpuChipIcon, BoltIcon,
  EyeIcon, ShoppingCartIcon, TruckIcon, BanknotesIcon
} from '@heroicons/react/24/outline';
import { salesAPI, analyticsAPI, inventoryAPI, authAPI, dashboardAPI } from '../utils/api';
import OnboardingTour from '../components/OnboardingTour';
import DemandForecast from '../components/DemandForecast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    sales: 0,
    products: 0,
    customers: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      fetchDashboardData();
    }
    return () => { mounted = false; };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const [dashboardRes, lowStockRes] = await Promise.all([
        dashboardAPI.getStats().catch(err => {
          console.error('Dashboard API error:', err);
          return { data: { 
            monthlyStats: { revenue: 0, sales: 0 },
            inventory: { totalProducts: 0 },
            recentSales: [],
            topProducts: [],
            salesTrend: []
          }};
        }),
        inventoryAPI.getLowStockProducts().catch(err => ({ data: [] }))
      ]);

      const dashboard = dashboardRes.data;
      const lowStock = lowStockRes.data;

      setStats({
        revenue: dashboard.monthlyStats?.revenue || 0,
        sales: dashboard.monthlyStats?.sales || 0,
        products: dashboard.inventory?.totalProducts || 0,
        customers: dashboard.recentSales?.length || 0
      });

      const formattedSalesData = dashboard.salesTrend?.map(item => ({
        name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: parseFloat(item.revenue) || 0,
        sales: parseInt(item.sales) || 0
      })) || [];
      setSalesData(formattedSalesData);

      setTopProducts(dashboard.topProducts || []);
      setRecentSales(dashboard.recentSales || []);
      setLowStockProducts(lowStock.slice(0, 5) || []);
      
      if (user.role === 'owner') {
        try {
          const businessResponse = await authAPI.getBusiness();
          setBusiness(businessResponse.data);
        } catch (error) {
          console.error('Error fetching business:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryData = topProducts.map((product, index) => ({
    name: product.product__name,
    value: product.total_sold,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] || '#6B7280'
  }));

  const quickActions = [
    { name: 'New Sale', icon: ShoppingCartIcon, href: '/pos', color: 'bg-blue-500', description: 'Process a new sale' },
    { name: 'Add Product', icon: ArchiveBoxIcon, href: '/inventory', color: 'bg-green-500', description: 'Add inventory item' },
    { name: 'View Reports', icon: ChartBarIcon, href: '/reports', color: 'bg-purple-500', description: 'Business analytics' },
    { name: 'Smart Reorder', icon: TruckIcon, href: '/smart-reorder', color: 'bg-orange-500', description: 'AI recommendations' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BoltIcon className="h-8 w-8 text-blue-600 mr-3" />
                Business Dashboard
              </h1>
              <p className="text-gray-600 mt-2 flex items-center">
                <CpuChipIcon className="h-4 w-4 mr-2 text-blue-500" />
                AI-powered insights and real-time analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">Last updated</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Service Health Status */}
        {business && business.subscription_status !== 'active' && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  <strong>Service Notice:</strong> {business.subscription_status === 'trial' ? 
                    `Trial expires in ${business.trial_days_left} days` : 
                    'Subscription expired - some features may be limited'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: 'Total Revenue', 
              value: `₦${stats.revenue.toLocaleString()}`, 
              icon: BanknotesIcon, 
              change: '+12.5%', 
              trend: 'up',
              color: 'from-green-400 to-green-600',
              bgColor: 'bg-green-50'
            },
            { 
              title: 'Total Sales', 
              value: stats.sales.toLocaleString(), 
              icon: ShoppingBagIcon, 
              change: '+8.2%', 
              trend: 'up',
              color: 'from-blue-400 to-blue-600',
              bgColor: 'bg-blue-50'
            },
            { 
              title: 'Products', 
              value: stats.products.toLocaleString(), 
              icon: ArchiveBoxIcon, 
              change: '+2.1%', 
              trend: 'up',
              color: 'from-purple-400 to-purple-600',
              bgColor: 'bg-purple-50'
            },
            { 
              title: 'Active Orders', 
              value: stats.customers.toLocaleString(), 
              icon: UsersIcon, 
              change: '+15.3%', 
              trend: 'up',
              color: 'from-orange-400 to-orange-600',
              bgColor: 'bg-orange-50'
            }
          ].map((metric, index) => (
            <div key={index} className={`${metric.bgColor} border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
              <div className="flex items-start justify-between">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${metric.color}`}>
                    <metric.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <dl className="space-y-2">
                    <dt className="text-sm font-medium text-gray-600 truncate">{metric.title}</dt>
                    <dd className="space-y-1">
                      <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                      <div className={`flex items-center text-sm font-semibold ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <ArrowTrendingUpIcon className="flex-shrink-0 h-4 w-4 mr-1" />
                        <span>{metric.change}</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BoltIcon className="h-5 w-5 mr-2 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="group p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.name}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* AI Forecasting */}
          <div className="lg:col-span-1">
            <DemandForecast />
          </div>

          {/* Sales Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Sales Performance
                  </h3>
                  <p className="text-sm text-gray-500">Revenue trend over the last 7 days</p>
                </div>
                <select className="text-sm border-gray-300 rounded-lg px-3 py-1">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
            </div>
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fill="url(#salesGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <EyeIcon className="h-5 w-5 mr-2 text-green-600" />
                Top Products
              </h3>
              <p className="text-sm text-gray-500">Best performing items</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {categoryData.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: product.color }}></div>
                      <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">{product.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Activity
                </h3>
                <Link to="/sales" className="text-sm text-blue-600 hover:text-blue-500 font-medium">View all</Link>
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                  ) : recentSales.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">No recent sales</td></tr>
                  ) : (
                    recentSales.map((sale, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{sale.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₦{sale.total_amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
                  Stock Alerts
                </h3>
                <Link to="/inventory" className="text-sm text-blue-600 hover:text-blue-500 font-medium">Manage inventory</Link>
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                  ) : lowStockProducts.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-4 text-center text-green-600 font-medium">✅ All products in stock</td></tr>
                  ) : (
                    lowStockProducts.map((item, index) => {
                      const status = item.stock_quantity === 0 ? 'Out of Stock' : 
                                    item.stock_quantity <= 5 ? 'Critical' : 'Low';
                      const statusColor = item.stock_quantity === 0 ? 'text-red-600 bg-red-50' : 
                                         item.stock_quantity <= 5 ? 'text-orange-600 bg-orange-50' : 'text-yellow-600 bg-yellow-50';
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <div className="max-w-[200px] truncate" title={item.name}>{item.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.stock_quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
};

export default Dashboard;