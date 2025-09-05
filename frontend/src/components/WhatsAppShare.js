import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';

const WhatsAppShare = ({ isOpen, onClose, receiptData }) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const sendWhatsApp = () => {
    if (!phoneNumber.trim()) {
      alert('Please enter phone number');
      return;
    }

    const message = receiptData ? 
      `🧾 Receipt from SupaWave\n\n` +
      `Receipt #: ${receiptData.id}\n` +
      `Total: ₦${receiptData.total_amount}\n` +
      `Date: ${new Date().toLocaleDateString()}\n\n` +
      `Thank you for shopping with us! 🙏` :
      `📊 Business Update\n\n` +
      `Daily sales report and updates from your store.\n\n` +
      `Powered by SupaWave POS 🚀`;

    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send via WhatsApp">
      <div className="space-y-4">
        <Card>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">📱</div>
              <h3 className="font-semibold">Share via WhatsApp</h3>
              <p className="text-sm text-gray-600">
                {receiptData ? 'Send receipt to customer' : 'Share business update'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Input
          label="Phone Number"
          placeholder="e.g., +2348012345678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <div className="flex space-x-3">
          <Button onClick={sendWhatsApp} className="flex-1">
            Send WhatsApp
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppShare;