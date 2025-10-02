import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, ArchiveBoxIcon, ShoppingCartIcon, ChartBarIcon, 
  DocumentTextIcon, UsersIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, BuildingStorefrontIcon, ChevronLeftIcon, ChevronRightIcon,
  UserGroupIcon, XMarkIcon, ClipboardDocumentListIcon, CreditCardIcon, BanknotesIcon,
  ArrowsRightLeftIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon, GlobeAltIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { authAPI } from '../utils/api';
import NotificationBell from './NotificationBell';
import Logo from './Logo';
import ChatAssistant from './ChatAssistant';
import StoreSelector from './StoreSelector';

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
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await authAPI.getBusiness();
      setBusiness(response.data);
    } catch (error) {
      console.error('Error fetching business:', error);
      if (error.message.includes('401')) {
        localStorage.clear();
        navigate('/login');
      } else {
        setBusiness({ name: 'Store' });
      }
    }
  };

  const getNavigation = () => {
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'staff';
    
    const navigationGroups = [
      {
        title: 'Main',
        items: [
          { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['owner', 'manager', 'staff'] },
          { name: 'POS', href: '/pos', icon: ShoppingCartIcon, roles: ['owner', 'manager', 'staff'] },
        ]
      },
      {
        title: 'Inventory',
        items: [
          { name: 'Products', href: '/inventory', icon: ArchiveBoxIcon, roles: ['owner', 'manager'] },
          { name: 'Smart Reorder', href: '/smart-reorder', icon: CpuChipIcon, roles: ['owner', 'manager'] },
          { name: 'Stock Take', href: '/stock-take', icon: ClipboardDocumentListIcon, roles: ['owner', 'manager'] },
          { name: 'Transfers', href: '/transfers', icon: ArrowsRightLeftIcon, roles: ['owner'] },
        ]
      },
      {
        title: 'Sales',
        items: [
          { name: 'Credit Sales', href: '/credit', icon: CreditCardIcon, roles: ['owner', 'manager'] },
          { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, roles: ['owner', 'manager'] },
          { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['owner', 'manager'] },
        ]
      },
      {
        title: 'Finance',
        items: [
          { name: 'Financial Dashboard', href: '/finance', icon: BanknotesIcon, roles: ['owner', 'manager'] },
          { name: 'Expenses', href: '/expenses', icon: CreditCardIcon, roles: ['owner', 'manager'] },
          { name: 'Advanced Reports', href: '/advanced-reports', icon: DocumentTextIcon, roles: ['owner', 'manager'] },
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
          { name: 'Profile', href: '/profile', icon: BuildingStorefrontIcon, roles: ['owner'] },
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

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

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
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
          {/* Logo */}
          <div className={`flex items-center h-16 px-4 border-b border-gray-200 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              {sidebarCollapsed ? (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
              ) : (
                <Logo size="small" />
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Collapsed toggle */}
          {sidebarCollapsed && (
            <div className="flex justify-center py-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-6">
              {getNavigation().map((group) => (
                <div key={group.title}>
                  {!sidebarCollapsed && (
                    <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
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
                              ? 'bg-blue-50 text-blue-700'
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
          <div className="p-4 border-t border-gray-200">
            <div className={`flex items-center p-2 rounded-md hover:bg-gray-50 ${
              sidebarCollapsed ? 'justify-center' : 'space-x-3'
            }`}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {(business?.business_name || business?.name)?.charAt(0) || 'S'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {business?.business_name || business?.name || 'Store Name'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {business?.subscription_status === 'active' ? 'Premium' :
                     business?.subscription_status === 'trial' ? 'Trial' : 'Free'}
                  </p>
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
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {getNavigation().flatMap(group => group.items).find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <StoreSelector />
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main>
          {children}
        </main>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 h-16 px-2">
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
                className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg mx-1 my-2 transition-colors ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-xl">
            {/* Mobile Header */}
            <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <Logo size="medium" />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="px-3 py-4 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
              <div className="space-y-6">
                {getNavigation().map((group) => (
                  <div key={group.title}>
                    <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>

            {/* Mobile User Profile */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3 p-2 rounded-md">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {(business?.business_name || business?.name)?.charAt(0) || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {business?.business_name || business?.name || 'Store Name'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {business?.subscription_status === 'active' ? 'Premium' :
                     business?.subscription_status === 'trial' ? 'Trial' : 'Free'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="mt-2 w-full flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
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