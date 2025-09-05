import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  CurrencyDollarIcon, ShoppingBagIcon, ArchiveBoxIcon, UsersIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { salesAPI, analyticsAPI, inventoryAPI } from '../utils/api';
import OnboardingTour from '../components/OnboardingTour';

const WelcomeHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.first_name || user.username || 'there';
  };

  return (
    <div className="bg-gradient-to-r from-sky-400 to-blue-500 p-3 sm:p-6 text-white relative overflow-hidden">
      <style>{`
        @keyframes realDance {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-10deg) scale(1.05); }
          50% { transform: rotate(10deg) scale(0.95); }
          75% { transform: rotate(-5deg) scale(1.05); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <h1 className="text-lg sm:text-2xl font-bold">{getTimeGreeting()}, {getUserName()}! 👋</h1>
          <div className="text-2xl sm:text-4xl w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center" style={{
            animation: 'realDance 3s ease-in-out infinite'
          }}>
            🕺
          </div>
        </div>
        <div className="text-left sm:text-right text-sky-100">
          <div className="text-sm sm:text-lg font-medium">{currentTime.toLocaleTimeString()}</div>
          <div className="text-xs sm:text-sm hidden sm:block">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div className="text-xs sm:hidden">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        </div>
      </div>
      <p className="text-sky-100 text-sm sm:text-base">Here's what's happening with your business today</p>
      

    </div>
  );
};

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
      console.log('Fetching dashboard data...');
      
      const [analyticsRes, quickStatsRes, salesRes, lowStockRes] = await Promise.all([
        salesAPI.getAnalytics().catch(err => {
          console.error('Analytics API error:', err);
          return { data: { monthly_revenue: 0, monthly_sales_count: 0, daily_revenue: [], top_products: [] } };
        }),
        analyticsAPI.getQuickStats().catch(err => {
          console.error('Quick stats API error:', err);
          return { data: { total_products: 0 } };
        }),
        salesAPI.getSales().catch(err => {
          console.error('Sales API error:', err);
          return { data: [] };
        }),
        inventoryAPI.getLowStockProducts().catch(err => {
          console.error('Low stock API error:', err);
          return { data: [] };
        })
      ]);
      
      console.log('API responses:', { analyticsRes, quickStatsRes, salesRes, lowStockRes });

      const analytics = analyticsRes.data;
      const quickStats = quickStatsRes.data;
      const sales = salesRes.data;
      const lowStock = lowStockRes.data;

      setStats({
        revenue: analytics.monthly_revenue || 0,
        sales: analytics.monthly_sales_count || 0,
        products: quickStats.total_products || 0,
        customers: sales.length || 0
      });

      const formattedSalesData = analytics.daily_revenue?.map(item => ({
        name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: item.revenue,
        sales: Math.floor(item.revenue / 1000)
      })).reverse() || [];
      setSalesData(formattedSalesData);

      setTopProducts(analytics.top_products || []);
      setRecentSales(sales.slice(0, 3) || []);
      setLowStockProducts(lowStock.slice(0, 3) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryData = topProducts.map((product, index) => ({
    name: product.product__name,
    value: product.total_sold,
    color: ['#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD', '#E0F2FE'][index] || '#0EA5E9'
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <WelcomeHeader />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          { title: 'Monthly Revenue', value: `₦${stats.revenue.toLocaleString()}`, icon: CurrencyDollarIcon, change: '+12%', positive: true },
          { title: 'Monthly Sales', value: stats.sales, icon: ShoppingBagIcon, change: '+8%', positive: true },
          { title: 'Products', value: stats.products, icon: ArchiveBoxIcon, change: '+3%', positive: true },
          { title: 'Recent Orders', value: stats.customers, icon: UsersIcon, change: '+15%', positive: true }
        ].map((stat, index) => (
          <div key={stat.title} className="bg-white p-3 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 rounded-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1 sm:p-2 bg-sky-50 rounded">
                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-sky-600" />
              </div>
              <div className={`flex items-center space-x-1 text-xs sm:text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'} hidden sm:flex`}>
                <ArrowTrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium">{stat.change}</span>
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-xs sm:text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-3 sm:p-6 shadow-sm border border-gray-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sales Overview</h3>
            <select className="text-xs sm:text-sm border border-gray-300 rounded px-2 sm:px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="h-48 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#0EA5E9" 
                  strokeWidth={2}
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Chart */}
        <div className="bg-white p-3 sm:p-6 shadow-sm border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sales by Category</h3>
          </div>
          <div className="h-48 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-4">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                <span className="text-xs sm:text-sm text-gray-600 truncate">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Recent Sales */}
        <div className="bg-white p-3 sm:p-6 shadow-sm border border-gray-200 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : recentSales.length === 0 ? (
              <div className="text-center text-gray-500">No recent sales</div>
            ) : (
              recentSales.map((sale, index) => (
                <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Sale #{sale.id}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{new Date(sale.created_at).toLocaleString()}</p>
                  </div>
                  <p className="font-semibold text-sky-600 text-sm sm:text-base">₦{sale.total_amount?.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-3 sm:p-6 shadow-sm border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Low Stock Alert</h3>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center text-green-500">All products in stock!</div>
            ) : (
              lowStockProducts.map((item, index) => {
                const status = item.stock_quantity === 0 ? 'Out of Stock' : 
                              item.stock_quantity <= 5 ? 'Very Low' : 'Low Stock';
                return (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{item.stock_quantity} units remaining</p>
                    </div>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded ${
                      item.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
};

export default Dashboard;
