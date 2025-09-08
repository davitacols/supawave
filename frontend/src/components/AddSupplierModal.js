import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';

const AddSupplierModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    supplier_type: 'farmer',
    contact_person: '',
    phone: '',
    location: '',
    products_offered: '',
    delivery_available: false,
    minimum_order: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      supplier_type: 'farmer',
      contact_person: '',
      phone: '',
      location: '',
      products_offered: '',
      delivery_available: false,
      minimum_order: ''
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add New Supplier</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Adamu Farms, Lagos Bakery"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Supplier Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type</label>
              <select
                name="supplier_type"
                value={formData.supplier_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="farmer">Local Farmer</option>
                <option value="producer">Local Producer</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  placeholder="e.g., Musa Ibrahim"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +234 801 234 5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Kano State, Kaduna, Lagos Island"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Products Offered */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Products Offered</label>
              <textarea
                name="products_offered"
                value={formData.products_offered}
                onChange={handleChange}
                rows="3"
                placeholder="e.g., Rice, Beans, Maize, Yam (separate with commas)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple products with commas</p>
            </div>

            {/* Minimum Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (₦)</label>
              <input
                type="number"
                name="minimum_order"
                value={formData.minimum_order}
                onChange={handleChange}
                placeholder="e.g., 50000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Delivery Available */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="delivery_available"
                checked={formData.delivery_available}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                This supplier offers delivery services
              </label>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Supplier will be added to your network</li>
                <li>• You can contact them directly for orders</li>
                <li>• Other stores can also discover this supplier</li>
                <li>• Supplier can be verified later for trust</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Supplier
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSupplierModal;