import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import BarcodeScanner from './BarcodeScanner';
import QuickReport from './QuickReport';
import PriceChecker from './PriceChecker';
import WhatsAppShare from './WhatsAppShare';
import { 
  QrCodeIcon, 
  DevicePhoneMobileIcon, 
  GiftIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const QuickActions = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showPriceChecker, setShowPriceChecker] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const actions = [
    { 
      icon: QrCodeIcon, 
      label: 'Scan Product', 
      color: 'bg-blue-500', 
      action: () => setShowScanner(true)
    },
    { 
      icon: DevicePhoneMobileIcon, 
      label: 'WhatsApp Share', 
      color: 'bg-green-500', 
      action: () => setShowWhatsApp(true)
    },
    { 
      icon: GiftIcon, 
      label: 'Loyalty Points', 
      color: 'bg-purple-500', 
      action: () => alert('Loyalty system coming soon!')
    },
    { 
      icon: ChartBarIcon, 
      label: 'Quick Report', 
      color: 'bg-orange-500', 
      action: () => setShowReport(true)
    },
    { 
      icon: CurrencyDollarIcon, 
      label: 'Price Check', 
      color: 'bg-indigo-500', 
      action: () => setShowPriceChecker(true)
    },
    { 
      icon: UserGroupIcon, 
      label: 'Customer List', 
      color: 'bg-pink-500', 
      action: () => alert('Customer management coming soon!')
    },
  ];

  const handleProductFound = (product) => {
    alert(`Product found: ${product.name} - ₦${product.selling_price}`);
    setShowScanner(false);
  };

  return (
    <>
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 flex-col space-y-2 hover:shadow-md transition-all"
                onClick={action.action}
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {showScanner && (
        <BarcodeScanner
          onProductFound={handleProductFound}
          onClose={() => setShowScanner(false)}
        />
      )}
      
      <QuickReport 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
      />
      
      <PriceChecker 
        isOpen={showPriceChecker} 
        onClose={() => setShowPriceChecker(false)} 
      />
      
      <WhatsAppShare 
        isOpen={showWhatsApp} 
        onClose={() => setShowWhatsApp(false)} 
      />
    </>
  );
};

export default QuickActions;