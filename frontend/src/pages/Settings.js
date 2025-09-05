import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, BellIcon, ShieldCheckIcon, CreditCardIcon,
  DocumentArrowDownIcon, TrashIcon, KeyIcon, GlobeAltIcon,
  DevicePhoneMobileIcon, EnvelopeIcon, PrinterIcon
} from '@heroicons/react/24/outline';
import { authAPI } from '../utils/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    notifications: {
      email_alerts: true,
      sms_alerts: false,
      low_stock_alerts: true,
      daily_reports: true,
      payment_reminders: true
    },
    system: {
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      date_format: 'DD/MM/YYYY',
      low_stock_threshold: 5,
      auto_backup: true
    },
    receipt: {
      show_logo: true,
      footer_text: 'Thank you for shopping with us!',
      show_barcode: true,
      paper_size: 'A4'
    },
    security: {
      two_factor_auth: false,
      session_timeout: 30,
      password_expiry: 90
    }
  });
  const [loading, setLoading] = useState(false);

  const updateSettings = async (category) => {
    setLoading(true);
    try {
      // This would call the appropriate API endpoint
      console.log('Updating settings:', category, settings[category]);
      alert('Settings updated successfully!');
    } catch (error) {
      alert('Error updating settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };
  
  const exportData = async () => {
    try {
      // This would call the export API
      alert('Data export started. You will receive an email when ready.');
    } catch (error) {
      alert('Error exporting data');
    }
  };
  
  const deleteAllData = async () => {
    if (window.confirm('Are you sure? This will permanently delete all your data and cannot be undone.')) {
      try {
        // This would call the delete API
        alert('Data deletion initiated.');
      } catch (error) {
        alert('Error deleting data');
      }
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'data', name: 'Data', icon: DocumentArrowDownIcon }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select 
                value={settings.system.currency}
                onChange={(e) => handleSettingChange('system', 'currency', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2"
              >
                <option value="NGN">Nigerian Naira (₦)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="GHS">Ghana Cedi (₵)</option>
                <option value="KES">Kenyan Shilling (KSh)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select 
                value={settings.system.timezone}
                onChange={(e) => handleSettingChange('system', 'timezone', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2"
              >
                <option value="Africa/Lagos">West Africa Time (WAT)</option>
                <option value="Africa/Accra">Ghana Mean Time (GMT)</option>
                <option value="Africa/Nairobi">East Africa Time (EAT)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select 
                value={settings.system.date_format}
                onChange={(e) => handleSettingChange('system', 'date_format', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
              <input
                type="number"
                value={settings.system.low_stock_threshold}
                onChange={(e) => handleSettingChange('system', 'low_stock_threshold', parseInt(e.target.value))}
                className="w-full border border-gray-300 px-3 py-2"
                min="1"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                checked={settings.system.auto_backup}
                onChange={(e) => handleSettingChange('system', 'auto_backup', e.target.checked)}
                className="h-4 w-4 text-blue-600" 
              />
              <span className="text-sm text-gray-700">Enable automatic daily backups</span>
            </label>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button 
              onClick={() => updateSettings('system')}
              className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700"
            >
              Save General Settings
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Email Notifications
              </h4>
              <div className="space-y-3">
                {[
                  { key: 'email_alerts', label: 'General email alerts' },
                  { key: 'low_stock_alerts', label: 'Low stock notifications' },
                  { key: 'daily_reports', label: 'Daily sales reports' },
                  { key: 'payment_reminders', label: 'Payment reminders' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications[item.key]}
                      onChange={(e) => handleSettingChange('notifications', item.key, e.target.checked)}
                      className="h-4 w-4 text-blue-600" 
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
                SMS Notifications
              </h4>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={settings.notifications.sms_alerts}
                  onChange={(e) => handleSettingChange('notifications', 'sms_alerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600" 
                />
                <span className="text-sm text-gray-700">Enable SMS alerts</span>
              </label>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button 
              onClick={() => updateSettings('notifications')}
              className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700"
            >
              Save Notification Settings
            </button>
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="bg-white shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={settings.security.two_factor_auth}
                  onChange={(e) => handleSettingChange('security', 'two_factor_auth', e.target.checked)}
                  className="h-4 w-4 text-blue-600" 
                />
                <span className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication</span>
              </label>
              <p className="text-xs text-gray-500 ml-7">Add an extra layer of security to your account</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.session_timeout}
                  onChange={(e) => handleSettingChange('security', 'session_timeout', parseInt(e.target.value))}
                  className="w-full border border-gray-300 px-3 py-2"
                  min="5"
                  max="480"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                <input
                  type="number"
                  value={settings.security.password_expiry}
                  onChange={(e) => handleSettingChange('security', 'password_expiry', parseInt(e.target.value))}
                  className="w-full border border-gray-300 px-3 py-2"
                  min="30"
                  max="365"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                <KeyIcon className="h-4 w-4" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button 
              onClick={() => updateSettings('security')}
              className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700"
            >
              Save Security Settings
            </button>
          </div>
        </div>
      )}

      {/* Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Subscription & Billing</h3>
            
            <div className="bg-green-50 border border-green-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-900">Premium Plan</h4>
                  <p className="text-sm text-green-700">Active until January 15, 2024</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-900">₦15,000</p>
                  <p className="text-sm text-green-700">per month</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
                <div className="border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">**** **** **** 1234</p>
                  <p className="text-xs text-gray-500">Expires 12/25</p>
                </div>
                <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm">Update Payment Method</button>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Billing History</h4>
                <div className="space-y-2">
                  {[
                    { date: 'Dec 15, 2023', amount: '₦15,000', status: 'Paid' },
                    { date: 'Nov 15, 2023', amount: '₦15,000', status: 'Paid' },
                    { date: 'Oct 15, 2023', amount: '₦15,000', status: 'Paid' }
                  ].map((bill, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{bill.date}</span>
                      <span className="font-medium">{bill.amount}</span>
                      <span className="text-green-600">{bill.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow border border-gray-200 p-6">
            <h4 className="font-medium text-gray-900 mb-4">Receipt Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Footer Text</label>
                <input
                  type="text"
                  value={settings.receipt.footer_text}
                  onChange={(e) => handleSettingChange('receipt', 'footer_text', e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2"
                  placeholder="Thank you message"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                <select 
                  value={settings.receipt.paper_size}
                  onChange={(e) => handleSettingChange('receipt', 'paper_size', e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2"
                >
                  <option value="A4">A4</option>
                  <option value="80mm">80mm Thermal</option>
                  <option value="58mm">58mm Thermal</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={settings.receipt.show_logo}
                  onChange={(e) => handleSettingChange('receipt', 'show_logo', e.target.checked)}
                  className="h-4 w-4 text-blue-600" 
                />
                <span className="text-sm text-gray-700">Show logo on receipts</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={settings.receipt.show_barcode}
                  onChange={(e) => handleSettingChange('receipt', 'show_barcode', e.target.checked)}
                  className="h-4 w-4 text-blue-600" 
                />
                <span className="text-sm text-gray-700">Show barcode on receipts</span>
              </label>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={() => updateSettings('receipt')}
                className="bg-blue-600 text-white px-6 py-2 hover:bg-blue-700"
              >
                Save Receipt Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Management */}
      {activeTab === 'data' && (
        <div className="bg-white shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Data Management</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Export Data</h4>
              <p className="text-sm text-gray-600 mb-4">Download all your business data in CSV format</p>
              <button 
                onClick={exportData}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export All Data</span>
              </button>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <h4 className="font-medium text-red-900 mb-3">Danger Zone</h4>
              <p className="text-sm text-red-600 mb-4">Permanently delete all your business data. This action cannot be undone.</p>
              <button 
                onClick={deleteAllData}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete All Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
