import React, { useState } from 'react';
import { XMarkIcon, PhoneIcon, ChatBubbleLeftRightIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';

const ContactSupplierModal = ({ isOpen, onClose, supplier }) => {
  const [message, setMessage] = useState('');

  if (!isOpen || !supplier) return null;

  const handlePhoneCall = () => {
    window.open(`tel:${supplier.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    const whatsappMessage = message || `Hi ${supplier.contact_person}, I'm interested in your products: ${supplier.products_offered}. Can we discuss pricing and availability?`;
    const phoneNumber = supplier.phone.replace(/[^\d]/g, ''); // Remove non-digits
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSMS = () => {
    const smsMessage = message || `Hi ${supplier.contact_person}, I'm interested in your products. Please contact me to discuss.`;
    const smsUrl = `sms:${supplier.phone}?body=${encodeURIComponent(smsMessage)}`;
    window.open(smsUrl, '_self');
  };

  const defaultMessage = `Hi ${supplier.contact_person},

I'm a store owner interested in your products: ${supplier.products_offered}.

Could you please provide:
- Current pricing
- Minimum order quantities  
- Delivery options
- Payment terms

Looking forward to working together!

Best regards`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Contact Supplier</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Supplier Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
            <p className="text-sm text-gray-600">{supplier.supplier_type}</p>
            <p className="text-sm text-gray-600">Contact: {supplier.contact_person}</p>
            <p className="text-sm text-gray-600">Phone: {supplier.phone}</p>
            <p className="text-sm text-gray-600">Location: {supplier.location}</p>
          </div>

          {/* Message Template */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional - will use default if empty)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={defaultMessage}
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contact Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Choose contact method:</h4>
            
            {/* Phone Call */}
            <Button
              onClick={handlePhoneCall}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <PhoneIcon className="h-5 w-5" />
              <span>Call {supplier.phone}</span>
            </Button>

            {/* WhatsApp */}
            <Button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span>WhatsApp Message</span>
            </Button>

            {/* SMS */}
            <Button
              onClick={handleSMS}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
            >
              <EnvelopeIcon className="h-5 w-5" />
              <span>Send SMS</span>
            </Button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Phone calls work best in Africa. WhatsApp is widely used and SMS is a good backup option.
            </p>
          </div>

          {/* Close Button */}
          <div className="mt-6">
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupplierModal;