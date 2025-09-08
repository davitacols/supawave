import React from 'react';
import { XMarkIcon, PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const ContactSellerModal = ({ isOpen, onClose, listing }) => {
  if (!isOpen || !listing) return null;

  const handlePhoneCall = () => {
    // In a real app, this would integrate with the phone system
    alert(`Calling ${listing.seller_name}...`);
  };

  const handleWhatsApp = () => {
    const message = `Hi! I'm interested in your listing: ${listing.title}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSMS = () => {
    const message = `Hi! I'm interested in your listing: ${listing.title}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Contact Seller</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <Card className="p-4 mb-6 bg-gray-50">
          <h3 className="font-medium text-gray-900">{listing.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{listing.seller_name}</p>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">{listing.quantity} units available</span>
            <span className="text-sm font-medium">₦{listing.unit_price}/unit</span>
          </div>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handlePhoneCall}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <PhoneIcon className="h-5 w-5" />
            <span>Call Seller</span>
          </Button>

          <Button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span>WhatsApp</span>
          </Button>

          <Button
            onClick={handleSMS}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span>Send SMS</span>
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-4"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactSellerModal;