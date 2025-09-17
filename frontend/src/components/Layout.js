import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, ArchiveBoxIcon, ShoppingCartIcon, ChartBarIcon, 
  DocumentTextIcon, UsersIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, BuildingStorefrontIcon, ChevronLeftIcon, ChevronRightIcon,
  UserGroupIcon, XMarkIcon, ClipboardDocumentListIcon, CreditCardIcon, BanknotesIcon,
  ArrowsRightLeftIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon, GlobeAltIcon
} from '@heroicons/react/24/outline';
import { authAPI } from '../utils/api';
import NotificationBell from './NotificationBell';
import Logo from './Logo';
import ChatAssistant from './ChatAssistant';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [business, setBusiness] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      fetchBusiness();
    }
    return () => { mounted = false; };
  }, []);

  const fetchBusiness = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        console.log('❌ No token found, redirecting to login');
        navigate('/login');
        return;
      }
      
      const response = await authAPI.getBusiness();
      console.log('✅ Business data:', response.data);
      setBusiness(response.data);
    } catch (error) {
      console.error('Error fetching business:', error);
      if (error.message.includes('401')) {
        console.log('🔄 Token expired, redirecting to login');
        localStorage.clear();
        navigate('/login');
      } else {
        setBusiness({ name: 'Store' }); // Fallback
      }
    }
  };

  const getNavigation = () => {
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'staff';
    
    const navigationGroups = [
      {
        title: 'Overview',
        items: [
          { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['owner', 'manager', 'staff'] },
        ]
      },
      {
        title: 'Sales & Operations',
        items: [
          { name: 'POS', href: '/pos', icon: ShoppingCartIcon, roles: ['owner', 'manager', 'staff'] },
          { name: 'Credit', href: '/credit', icon: CreditCardIcon, roles: ['owner', 'manager'] },
          { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, roles: ['owner', 'manager'] },
        ]
      },
      {
        title: 'Inventory',
        items: [
          { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon, roles: ['owner', 'manager'] },
          { name: 'Smart Reorder', href: '/smart-reorder', icon: ExclamationTriangleIcon, roles: ['owner', 'manager'] },
          { name: 'Stock Take', href: '/stock-take', icon: ClipboardDocumentListIcon, roles: ['owner', 'manager'] },
          { name: 'Transfers', href: '/transfers', icon: ArrowsRightLeftIcon, roles: ['owner'] },
        ]
      },
      {
        title: 'Analytics',
        items: [
          { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['owner', 'manager'] },
        ]
      },
      {
        title: 'Management',
        items: [
          { name: 'Customers', href: '/customers', icon: UsersIcon, roles: ['owner', 'manager'] },
          { name: 'Staff', href: '/staff', icon: UserGroupIcon, roles: ['owner', 'manager'] },
          { name: 'Stores', href: '/stores', icon: BuildingStorefrontIcon, roles: ['owner'] },
          { name: 'Marketplace', href: '/marketplace', icon: GlobeAltIcon, roles: ['owner', 'manager'] },
        ]
      },
      {
        title: 'Settings',
        items: [
          { name: 'WhatsApp', href: '/whatsapp', icon: ChatBubbleLeftRightIcon, roles: ['owner', 'manager'] },
          { name: 'Store Profile', href: '/profile', icon: BuildingStorefrontIcon, roles: ['owner'] },
          { name: 'Billing', href: '/billing', icon: BanknotesIcon, roles: ['owner'] },
          { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['owner'] },
        ]
      }
    ];
    
    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(userRole))
    })).filter(group => group.items.length > 0);
  };
  
  // const navigation = getNavigation(); // Unused variable

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with client-side logout even if API fails
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // Mobile navigation items (most important)
  const getMobileNavigation = () => {
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'staff';
    const mobileNav = [
      { name: 'Home', href: '/', icon: HomeIcon, roles: ['owner', 'manager', 'staff'] },
      { name: 'POS', href: '/pos', icon: ShoppingCartIcon, roles: ['owner', 'manager', 'staff'] },
      { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon, roles: ['owner', 'manager'] },
      { name: 'Logout', href: '#logout', icon: ArrowRightOnRectangleIcon, roles: ['owner', 'manager', 'staff'] }
    ];
    return mobileNav.filter(item => item.roles.includes(userRole));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-72'
      }`}>
        <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm overflow-hidden">
          {/* Logo */}
          <div className={`flex items-center h-18 px-6 border-b border-gray-100 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <Logo size={sidebarCollapsed ? "small" : "large"} />
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Collapsed toggle button */}
          {sidebarCollapsed && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            
            <div className="space-y-6">
              {getNavigation().map((group) => (
                <div key={group.title}>
                  {!sidebarCollapsed && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {group.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } ${sidebarCollapsed ? 'justify-center' : ''}`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'} ${
                            sidebarCollapsed ? '' : 'mr-3'
                          }`} />
                          {!sidebarCollapsed && item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <div className={`flex items-center p-2 rounded-md hover:bg-gray-50 ${
              sidebarCollapsed ? 'justify-center' : 'space-x-3'
            }`}>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                {(business?.business_name || business?.name)?.charAt(0) || 'S'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{business?.business_name || business?.name || 'Store Name'}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      business?.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                      business?.subscription_status === 'trial' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {business?.subscription_status === 'active' ? '✓ Premium' :
                       business?.subscription_status === 'trial' ? '🎁 Trial' :
                       '⚠️ Expired'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className={`mt-2 w-full flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <ArrowRightOnRectangleIcon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
              {!sidebarCollapsed && 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-18 items-center gap-x-4 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 lg:px-8 shadow-soft">
          <button
            type="button"
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getNavigation().flatMap(group => group.items).find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-strong safe-area-pb">
        <div className="grid grid-cols-4 h-18 px-2">
          {getMobileNavigation().map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href === '#' ? '#' : item.href}
                onClick={(e) => {
                  if (item.href === '#logout') {
                    e.preventDefault();
                    handleLogout();
                  }
                }}
                className={`flex flex-col items-center justify-center space-y-1.5 p-3 rounded-2xl mx-1 my-2 transition-all ${
                  isActive 
                    ? 'text-primary-600 bg-primary-50 shadow-soft' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-2xs font-medium truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 sm:w-80 bg-white border-r border-gray-200 transform translate-x-0 transition-transform duration-200 shadow-xl">
            {/* Mobile Sidebar Header */}
            <div className="h-16 px-4 border-b border-gray-100 bg-sky-50 flex items-center justify-between">
              <div className="flex items-center">
                <Logo size="small" />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="px-4 py-4 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
              <div className="space-y-6">
                {getNavigation().map((group) => (
                  <div key={group.title}>
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                              isActive
                                ? 'bg-sky-50 text-sky-700 border-l-4 border-sky-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-sky-600' : 'text-gray-400'}`} />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>

            {/* Mobile User Profile & Logout - Fixed at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-medium text-sm">
                  {(business?.business_name || business?.name)?.charAt(0) || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{business?.business_name || business?.name || 'Store Name'}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      business?.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                      business?.subscription_status === 'trial' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {business?.subscription_status === 'active' ? '✓ Premium' :
                       business?.subscription_status === 'trial' ? '🎁 Trial' :
                       '⚠️ Expired'}
                    </span>
                    {business?.trial_days_left && business?.subscription_status === 'trial' && (
                      <span className="text-xs text-gray-500">{business.trial_days_left}d left</span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
