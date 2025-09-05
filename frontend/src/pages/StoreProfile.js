import React, { useState, useEffect } from 'react';
import { 
  BuildingStorefrontIcon, PencilIcon, CheckIcon, XMarkIcon, 
  PhotoIcon, SwatchIcon, CogIcon
} from '@heroicons/react/24/outline';
import { authAPI } from '../utils/api';

const StoreProfile = () => {
  const [business, setBusiness] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      const response = await authAPI.getBusiness();
      setBusiness(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      let updateData = { ...formData };
      
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        Object.keys(updateData).forEach(key => {
          logoFormData.append(key, updateData[key]);
        });
        updateData = logoFormData;
      }
      
      const response = await authAPI.updateBusiness(updateData);
      setBusiness(response.data);
      setEditing(false);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      console.error('Error updating business:', error);
    } finally {
      setSaveLoading(false);
    }
  };
  
  const handleBrandingSave = async () => {
    setBrandingLoading(true);
    try {
      let updateData = { ...formData };
      
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        Object.keys(updateData).forEach(key => {
          logoFormData.append(key, updateData[key]);
        });
        updateData = logoFormData;
      }
      
      const response = await authAPI.updateBusiness(updateData);
      setBusiness(response.data);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      console.error('Error updating branding:', error);
    } finally {
      setBrandingLoading(false);
    }
  };
  
  const handlePreferencesSave = async () => {
    setPreferencesLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  };
  
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setFormData(business);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading store profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Store Profile</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="bg-white shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', name: 'Business Info', icon: BuildingStorefrontIcon },
              { id: 'branding', name: 'Branding', icon: SwatchIcon },
              { id: 'preferences', name: 'Preferences', icon: CogIcon }
            ].map((tab) => (
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

      {activeTab === 'profile' && (
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white flex items-center justify-center overflow-hidden">
                {business?.logo ? (
                  <img src={business.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{business?.name}</h2>
                <p className="text-blue-100 capitalize">{business?.business_type || 'Retail Store'}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{business?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                {editing ? (
                  <select
                    value={formData.business_type || ''}
                    onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="retail">Retail Store</option>
                    <option value="supermarket">Supermarket</option>
                    <option value="minimart">Mini Mart</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{business?.business_type || 'Retail Store'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{business?.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{business?.email || 'Not provided'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {editing ? (
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your business address"
                  />
                ) : (
                  <p className="text-gray-900">{business?.address || 'Not provided'}</p>
                )}
              </div>
            </div>

            {editing && (
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 disabled:opacity-50"
                >
                  {saveLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                  <span>{saveLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'branding' && (
        <div className="bg-white shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Store Branding</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Store Logo</label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {logoPreview || business?.logo ? (
                    <img 
                      src={logoPreview || business?.logo} 
                      alt="Logo" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
                  >
                    Upload Logo
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>
            
            {/* Brand Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Brand Colors</label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Primary Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.primary_color || '#3B82F6'}
                      onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                      className="w-12 h-8 border border-gray-300"
                    />
                    <input
                      type="text"
                      value={formData.primary_color || '#3B82F6'}
                      onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                      className="flex-1 border border-gray-300 px-3 py-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Secondary Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.secondary_color || '#6B7280'}
                      onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                      className="w-12 h-8 border border-gray-300"
                    />
                    <input
                      type="text"
                      value={formData.secondary_color || '#6B7280'}
                      onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                      className="flex-1 border border-gray-300 px-3 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleBrandingSave}
              disabled={brandingLoading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {brandingLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{brandingLoading ? 'Saving...' : 'Save Branding'}</span>
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'preferences' && (
        <div className="bg-white shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Store Preferences</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select className="w-full border border-gray-300 px-3 py-2">
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="GHS">Ghana Cedi (₵)</option>
                  <option value="KES">Kenyan Shilling (KSh)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select className="w-full border border-gray-300 px-3 py-2">
                  <option value="Africa/Lagos">West Africa Time (WAT)</option>
                  <option value="Africa/Accra">Ghana Mean Time (GMT)</option>
                  <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Alert</label>
                <input
                  type="number"
                  placeholder="5"
                  className="w-full border border-gray-300 px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Footer</label>
                <input
                  type="text"
                  placeholder="Thank you for shopping with us!"
                  className="w-full border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Notifications</h4>
              <div className="space-y-3">
                {[
                  { id: 'low_stock', label: 'Low stock alerts' },
                  { id: 'daily_sales', label: 'Daily sales summary' },
                  { id: 'new_orders', label: 'New order notifications' },
                  { id: 'payment_reminders', label: 'Payment reminders' }
                ].map((item) => (
                  <label key={item.id} className="flex items-center space-x-3">
                    <input type="checkbox" className="h-4 w-4 text-blue-600" defaultChecked />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button 
              onClick={handlePreferencesSave}
              disabled={preferencesLoading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {preferencesLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{preferencesLoading ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Subscription Details */}
      <div className="bg-white shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Plan</p>
            <p className="font-medium text-gray-900">Premium</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800">Active</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Billing</p>
            <p className="font-medium text-gray-900">Jan 15, 2024</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Cost</p>
            <p className="font-medium text-gray-900">₦15,000</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;
