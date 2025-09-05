import React, { useState } from 'react';
import { XMarkIcon, PhotoIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ProductModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  categories, 
  suppliers,
  onCreateCategory,
  onCreateSupplier 
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '', sku: '', selling_price: '', cost_price: '', stock_quantity: '',
    low_stock_threshold: '10', reorder_point: '5', max_stock: '100',
    category: '', supplier: '', image: null
  });
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplierData, setNewSupplierData] = useState({ name: '', contact: '' });

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '📝' },
    { id: 'pricing', name: 'Pricing & Stock', icon: '💰' },
    { id: 'media', name: 'Image & AI', icon: '🖼️' },
    { id: 'relations', name: 'Category & Supplier', icon: '🔗' }
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData({...formData, image: file});
    
    try {
      const formDataForAnalysis = new FormData();
      formDataForAnalysis.append('image', file);

      const analysisResponse = await fetch('http://localhost:8000/api/inventory/analyze-image/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: formDataForAnalysis
      });

      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json();
        setImageAnalysis(analysis);
        
        if (analysis.suggested_category && !formData.category) {
          const category = categories.find(c => c.name === analysis.suggested_category);
          if (category) {
            setFormData(prev => ({...prev, category: category.id}));
          }
        }
      }

      const duplicateResponse = await fetch('http://localhost:8000/api/inventory/check-duplicates/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: formDataForAnalysis
      });

      if (duplicateResponse.ok) {
        const duplicateData = await duplicateResponse.json();
        if (duplicateData.duplicates_found) {
          setDuplicateWarning(duplicateData.duplicates);
        }
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '', sku: '', selling_price: '', cost_price: '', stock_quantity: '',
      low_stock_threshold: '10', reorder_point: '5', max_stock: '100',
      category: '', supplier: '', image: null
    });
    setImageAnalysis(null);
    setDuplicateWarning(null);
    setActiveTab('basic');
    setShowNewCategory(false);
    setShowNewSupplier(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-lg sm:rounded-t-2xl">
          <h3 className="text-lg sm:text-xl font-bold text-white">Add New Product</h3>
          <button 
            onClick={() => { onClose(); resetForm(); }} 
            className="text-white hover:bg-sky-700 p-1.5 sm:p-2 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-4 sm:px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-sky-600 border-sky-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SKU (Optional)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pricing & Stock Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 sm:top-3 text-gray-500 text-sm sm:text-base">₦</span>
                      <input
                        type="number"
                        required
                        value={formData.selling_price}
                        onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 sm:top-3 text-gray-500 text-sm sm:text-base">₦</span>
                      <input
                        type="number"
                        required
                        value={formData.cost_price}
                        onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Alert</label>
                    <input
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Stock</label>
                    <input
                      type="number"
                      value={formData.max_stock}
                      onChange={(e) => setFormData({...formData, max_stock: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Media & AI Tab */}
            {activeTab === 'media' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-sky-400 transition-colors">
                    <PhotoIcon className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer bg-sky-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors text-sm sm:text-base"
                      >
                        Choose Image
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>

                {imageAnalysis && (
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
                      <h4 className="font-medium text-sky-900 text-sm sm:text-base">AI Analysis Results</h4>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <p className="text-xs sm:text-sm"><strong>Suggested Category:</strong> {imageAnalysis.suggested_category}</p>
                      {imageAnalysis.labels && (
                        <div>
                          <strong className="text-xs sm:text-sm">Detected Objects:</strong>
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                            {imageAnalysis.labels.slice(0, 6).map((label, index) => (
                              <span 
                                key={index} 
                                className="bg-sky-100 text-sky-800 px-2 sm:px-3 py-1 rounded-full text-xs"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {duplicateWarning && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                      <h4 className="font-medium text-yellow-900 text-sm sm:text-base">Possible Duplicates Found</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-yellow-800">
                      Similar products: {duplicateWarning.map(d => d.product_name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Relations Tab */}
            {activeTab === 'relations' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setShowNewCategory(true);
                        } else {
                          setFormData({...formData, category: e.target.value});
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                      <option value="new">+ Add New Category</option>
                    </select>
                    
                    {showNewCategory && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          placeholder="Category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              onCreateCategory(newCategoryName);
                              setShowNewCategory(false);
                              setNewCategoryName('');
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCategory(false);
                              setNewCategoryName('');
                            }}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                    <select
                      value={formData.supplier}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setShowNewSupplier(true);
                        } else {
                          setFormData({...formData, supplier: e.target.value});
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                      <option value="new">+ Add New Supplier</option>
                    </select>
                    
                    {showNewSupplier && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                        <input
                          type="text"
                          placeholder="Supplier name"
                          value={newSupplierData.name}
                          onChange={(e) => setNewSupplierData({...newSupplierData, name: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Contact (optional)"
                          value={newSupplierData.contact}
                          onChange={(e) => setNewSupplierData({...newSupplierData, contact: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              onCreateSupplier(newSupplierData);
                              setShowNewSupplier(false);
                              setNewSupplierData({ name: '', contact: '' });
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewSupplier(false);
                              setNewSupplierData({ name: '', contact: '' });
                            }}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 flex-shrink-0 rounded-b-lg sm:rounded-b-2xl">
            <div className="flex space-x-2">
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                    setActiveTab(tabs[currentIndex - 1].id);
                  }}
                  className="px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  ← Previous
                </button>
              )}
              {activeTab !== 'relations' && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                    setActiveTab(tabs[currentIndex + 1].id);
                  }}
                  className="px-3 sm:px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm sm:text-base"
                >
                  Next →
                </button>
              )}
            </div>
            
            <div className="flex space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={() => { onClose(); resetForm(); }}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-medium transition-colors text-sm sm:text-base"
              >
                Add Product
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;