import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authAPI } from '../utils/api';

const StoreCustomization = () => {
  const [businessData, setBusinessData] = useState({
    name: '',
    location: '',
    logo: null,
    primary_color: '#f97316',
    receipt_header: '',
    receipt_footer: ''
  });
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const response = await authAPI.getBusiness();
      setBusinessData(response.data);
      if (response.data.logo_url) {
        setLogoPreview(response.data.logo_url);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBusinessData({...businessData, logo: file});
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const updateBusiness = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('name', businessData.name || '');
      formData.append('location', businessData.location || '');
      formData.append('primary_color', businessData.primary_color || '#f97316');
      formData.append('receipt_header', businessData.receipt_header || '');
      formData.append('receipt_footer', businessData.receipt_footer || '');
      
      // Only add logo if it's a new file
      if (businessData.logo && businessData.logo instanceof File) {
        formData.append('logo', businessData.logo);
      }

      await authAPI.updateBusiness(formData);
      alert('Store customization updated successfully!');
      fetchBusinessData(); // Refresh data
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating store customization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Store Customization</h1>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Store Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-100  flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400">No Logo</span>
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
                  className="cursor-pointer bg-blue-500 text-white px-4 py-2  hover:bg-blue-600"
                >
                  Upload Logo
                </label>
                <p className="text-sm text-gray-500 mt-1">Recommended: 200x200px, PNG or JPG</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={businessData.primary_color}
                  onChange={(e) => setBusinessData({...businessData, primary_color: e.target.value})}
                  className="w-12 h-12 border border-gray-300  cursor-pointer"
                />
                <input
                  type="text"
                  value={businessData.primary_color}
                  onChange={(e) => setBusinessData({...businessData, primary_color: e.target.value})}
                  className="px-3 py-2 border border-gray-300  focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="#f97316"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Customization */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Header</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows="3"
                placeholder="Thank you for shopping with us!"
                value={businessData.receipt_header}
                onChange={(e) => setBusinessData({...businessData, receipt_header: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows="3"
                placeholder="Visit us again soon!"
                value={businessData.receipt_footer}
                onChange={(e) => setBusinessData({...businessData, receipt_footer: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border-2 border-dashed border-gray-300 p-6 max-w-sm mx-auto">
            <div className="text-center space-y-2">
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="w-16 h-16 mx-auto object-cover" />
              )}
              <h3 className="font-bold">{businessData.name || 'Your Store Name'}</h3>
              <p className="text-sm text-gray-600">{businessData.location || 'Store Address'}</p>
              {businessData.receipt_header && (
                <p className="text-sm border-t pt-2">{businessData.receipt_header.replace(/<[^>]*>/g, '')}</p>
              )}
              <div className="border-t border-b py-2 my-2">
                <div className="flex justify-between text-sm">
                  <span>Sample Item</span>
                  <span>₦1,000</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span style={{color: businessData.primary_color}}>₦1,000</span>
                </div>
              </div>
              {businessData.receipt_footer && (
                <p className="text-sm">{businessData.receipt_footer.replace(/<[^>]*>/g, '')}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={updateBusiness} disabled={loading} className="w-full">
        {loading ? 'Updating...' : 'Save Customization'}
      </Button>
    </div>
  );
};

export default StoreCustomization;
