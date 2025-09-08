import React from 'react';
import { XMarkIcon, CheckIcon, XMarkIcon as RejectIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

const OffersModal = ({ isOpen, onClose, listing, offers, onAccept, onReject }) => {
  if (!isOpen || !listing) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Offers for {listing.title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No offers received yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <Card key={offer.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{offer.buyer_name}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(offer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(offer.status)}>
                    {offer.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="ml-2 font-medium">{offer.quantity} units</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Offered Price:</span>
                    <span className="ml-2 font-medium">₦{offer.offered_price}/unit</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      ₦{offer.total_amount.toLocaleString()}
                    </span>
                  </div>
                  {offer.delivery_needed && (
                    <div>
                      <span className="text-sm text-gray-600">Delivery:</span>
                      <span className="ml-2 text-sm">Required</span>
                    </div>
                  )}
                </div>

                {offer.message && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Message:</p>
                    <p className="text-sm bg-gray-50 p-2 rounded">{offer.message}</p>
                  </div>
                )}

                {offer.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onAccept(offer.id)}
                      className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(offer.id)}
                      className="flex items-center space-x-1 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <RejectIcon className="h-4 w-4" />
                      <span>Reject</span>
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OffersModal;