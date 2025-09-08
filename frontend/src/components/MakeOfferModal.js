import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const MakeOfferModal = ({ isOpen, onClose, listing, onSubmit }) => {
  const [formData, setFormData] = useState({
    quantity: 1,
    offered_price: '',
    message: '',
    delivery_needed: false,
    pickup_time: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(listing.id, formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const totalAmount = formData.quantity * (formData.offered_price || 0);

  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Make Offer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <Card className="p-4 mb-4 bg-gray-50">
          <h3 className="font-medium text-gray-900">{listing.title}</h3>
          <p className="text-sm text-gray-600">{listing.product_name}</p>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">Available: {listing.quantity} units</span>
            <span className="text-sm font-medium">₦{listing.unit_price}/unit</span>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              max={listing.quantity}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Offer Price (per unit)
            </label>
            <input
              type="number"
              name="offered_price"
              value={formData.offered_price}
              onChange={handleChange}
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {totalAmount > 0 && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-semibold text-blue-600">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="2"
              placeholder="Add a message to the seller..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="delivery_needed"
              checked={formData.delivery_needed}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              I need delivery
            </label>
          </div>

          {formData.delivery_needed && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Pickup Time
              </label>
              <input
                type="datetime-local"
                name="pickup_time"
                value={formData.pickup_time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Submit Offer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakeOfferModal;