import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, ArchiveBoxIcon, ShoppingCartIcon, ChartBarIcon, 
  DocumentTextIcon, UsersIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, BuildingStorefrontIcon, ChevronLeftIcon, ChevronRightIcon,
  UserGroupIcon, XMarkIcon, ClipboardDocumentListIcon, CreditCardIcon, BanknotesIcon
} from '@heroicons/react/24/outline';
import { authAPI } from '../utils/api';
import NotificationBell from './NotificationBell';
import Logo from './Logo';

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
      const response = await authAPI.getBusiness();
      setBusiness(response.data);
    } catch (error) {
      console.error('Error fetching business:', error);
      setBusiness({ name: 'Store' }); // Fallback
    }
  };

  const getNavigation = () => {
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'cashier';
    console.log('Current user role:', userRole);
    
    const allNavigation = [
      { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['owner', 'manager', 'cashier'] },
      { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon, roles: ['owner', 'manager', 'cashier'] },
      { name: 'Stock Take', href: '/stock-take', icon: ClipboardDocumentListIcon, roles: ['owner', 'manager', 'cashier'] },
      { name: 'POS', href: '/pos', icon: ShoppingCartIcon, roles: ['owner', 'manager', 'cashier'] },
      { name: 'Credit', href: '/credit', icon: CreditCardIcon, roles: ['owner', 'manager'] },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['owner', 'manager'] },
      { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, roles: ['owner', 'manager'] },
      { name: 'Customers', href: '/customers', icon: UsersIcon, roles: ['owner', 'manager'] },
      { name: 'Staff', href: '/staff', icon: UserGroupIcon, roles: ['owner', 'manager'] },
      { name: 'Billing', href: '/billing', icon: BanknotesIcon, roles: ['owner'] },
      { name: 'Store Profile', href: '/profile', icon: BuildingStorefrontIcon, roles: ['owner'] },
      { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['owner'] },
    ];
    
    return allNavigation.filter(item => item.roles.includes(userRole));
  };
  
  const navigation = getNavigation();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Mobile navigation items (most important)
  const getMobileNavigation = () => {
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'cashier';
    const mobileNav = [
      { name: 'Home', href: '/', icon: HomeIcon, roles: ['owner', 'manager', 'cashier'] },
      { name: 'POS', href: '/pos', icon: ShoppingCartIcon, roles: ['owner', 'manager', 'cashier'] },
      { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon, roles: ['owner', 'manager', 'cashier'] },
      { name: 'Logout', href: '#logout', icon: ArrowRightOnRectangleIcon, roles: ['owner', 'manager', 'cashier'] }
    ];
    return mobileNav.filter(item => item.roles.includes(userRole));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block transition-all duration-200 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center p-1">
                <Logo size={24} className="text-white" />
              </div>
              {!sidebarCollapsed && <h1 className="text-lg font-semibold text-gray-900">SupaWave</h1>}
            </div>
            
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-auto p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {/* Collapse button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block p-1 text-gray-400 hover:text-gray-600"
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <div className="space-y-1">
              {getNavigation().map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
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
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-gray-100">
            <div className={`flex items-center p-2 rounded-md hover:bg-gray-50 ${
              sidebarCollapsed ? 'justify-center' : 'space-x-3'
            }`}>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                {business?.name?.charAt(0) || 'S'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{business?.name || 'Store Name'}</p>
                  <p className="text-xs text-gray-500">Premium</p>
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
      <div className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
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
            <h1 className="text-xl font-semibold text-gray-900">
              {getNavigation().find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
            
            <NotificationBell />
          </div>
        </div>

        {/* Page Content */}
        <main className="p-3 sm:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
        <div className="grid grid-cols-4 h-16">
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
                className={`flex flex-col items-center justify-center space-y-1 p-2 transition-colors ${
                  isActive ? 'text-sky-600 bg-sky-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium truncate">{item.name}</span>
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
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center p-1">
                  <Logo size={24} className="text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">SupaWave</h1>
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
              <div className="space-y-2">
                {getNavigation().map((item) => {
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
            </nav>

            {/* Mobile User Profile & Logout - Fixed at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-medium text-sm">
                  {business?.name?.charAt(0) || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{business?.name || 'Store Name'}</p>
                  <p className="text-xs text-gray-500">Premium Plan</p>
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
