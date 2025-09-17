import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  CurrencyDollarIcon, ShoppingBagIcon, ArchiveBoxIcon, UsersIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon,
  ChartBarIcon, ClockIcon, ServerIcon
} from '@heroicons/react/24/outline';
import { salesAPI, analyticsAPI, inventoryAPI, authAPI, dashboardAPI } from '../utils/api';
import OnboardingTour from '../components/OnboardingTour';

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
  const [transfers, setTransfers] = useState([]);
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
      
      // Use the new dashboard API
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
    color: ['#232F3E', '#FF9900', '#146EB4', '#FF6B6B', '#4ECDC4'][index] || '#232F3E'
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AWS-style Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor your inventory and business performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Last updated</p>
              <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Service Health Status */}
        {business && business.subscription_status !== 'active' && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Revenue', value: `₦${stats.revenue.toLocaleString()}`, icon: CurrencyDollarIcon, change: '+12.5%', trend: 'up' },
            { title: 'Total Sales', value: stats.sales.toLocaleString(), icon: ShoppingBagIcon, change: '+8.2%', trend: 'up' },
            { title: 'Products', value: stats.products.toLocaleString(), icon: ArchiveBoxIcon, change: '+2.1%', trend: 'up' },
            { title: 'Active Orders', value: stats.customers.toLocaleString(), icon: UsersIcon, change: '+15.3%', trend: 'up' }
          ].map((metric, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 min-h-[140px]">
              <div className="flex items-start justify-between h-full">
                <div className="flex-shrink-0">
                  <metric.icon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <dl className="space-y-2">
                    <dt className="text-sm font-medium text-gray-500 truncate">{metric.title}</dt>
                    <dd className="space-y-1">
                      <div className="text-2xl font-semibold text-gray-900 break-words">{metric.value}</div>
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Sales Trend</h3>
                  <p className="text-sm text-gray-500">Daily revenue over the last 7 days</p>
                </div>
                <select className="text-sm border-gray-300 rounded-md">
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
                        <stop offset="5%" stopColor="#232F3E" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#232F3E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#232F3E" 
                      strokeWidth={2}
                      fill="url(#salesGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
              <p className="text-sm text-gray-500">Best performing items</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {categoryData.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: product.color }}></div>
                      <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{product.value} sold</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Sales</h3>
                <Link to="/sales" className="text-sm text-blue-600 hover:text-blue-500">View all</Link>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₦{sale.total_amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Stock Alerts</h3>
                <Link to="/inventory" className="text-sm text-blue-600 hover:text-blue-500">Manage inventory</Link>
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
                    <tr><td colSpan="3" className="px-6 py-4 text-center text-green-600">All products in stock</td></tr>
                  ) : (
                    lowStockProducts.map((item, index) => {
                      const status = item.stock_quantity === 0 ? 'Out of Stock' : 
                                    item.stock_quantity <= 5 ? 'Critical' : 'Low';
                      const statusColor = item.stock_quantity === 0 ? 'text-red-600' : 
                                         item.stock_quantity <= 5 ? 'text-orange-600' : 'text-yellow-600';
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <div className="max-w-[200px] truncate" title={item.name}>{item.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock_quantity}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${statusColor}`}>{status}</td>
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