import React from 'react';

const PrintableInvoice = ({ invoice, businessData }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      {/* Header with Logo */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-4">
          {businessData.logo_url && (
            <img 
              src={businessData.logo_url} 
              alt="Logo" 
              className="w-16 h-16 object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{color: businessData.primary_color || '#f97316'}}>
              {businessData.name || 'Your Business'}
            </h1>
            <p className="text-gray-600">{businessData.location}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
          <p className="text-gray-600">#{invoice.invoice_number}</p>
        </div>
      </div>

      {/* Custom Header */}
      {businessData.receipt_header && (
        <div className="mb-6 p-3 bg-gray-50 text-center">
          <p className="text-sm text-gray-700">{businessData.receipt_header}</p>
        </div>
      )}

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
          <p className="font-medium">{invoice.customer_name}</p>
        </div>
        <div className="text-right">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Issue Date:</span>
              <span>{new Date(invoice.issue_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due Date:</span>
              <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2" style={{borderColor: businessData.primary_color || '#f97316'}}>
              <th className="text-left py-2">Description</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Unit Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3">{item.description}</td>
                <td className="text-center py-3">{item.quantity}</td>
                <td className="text-right py-3">₦{item.unit_price?.toLocaleString()}</td>
                <td className="text-right py-3">₦{item.total_price?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₦{invoice.subtotal?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (7.5%):</span>
            <span>₦{invoice.tax_amount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2" style={{color: businessData.primary_color || '#f97316'}}>
            <span>Total:</span>
            <span>₦{invoice.total_amount?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
          <p className="text-gray-700">{invoice.notes}</p>
        </div>
      )}

      {/* Custom Footer */}
      {businessData.receipt_footer && (
        <div className="mt-8 p-3 bg-gray-50 text-center">
          <p className="text-sm text-gray-700">{businessData.receipt_footer}</p>
        </div>
      )}
    </div>
  );
};

export default PrintableInvoice;