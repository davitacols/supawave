import React from 'react';
import { PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const InvoicePreview = ({ invoice, businessData, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Convert to PDF functionality would go here
    alert('PDF download functionality would be implemented here');
  };

  const calculateSubtotal = () => {
    return invoice.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.075; // 7.5% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold">Invoice Preview</h2>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 flex items-center space-x-2"
            >
              <PrinterIcon className="h-5 w-5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 hover:bg-green-700 flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 bg-white" id="invoice-content">
          {/* Business Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">{businessData.name || 'Your Business'}</h1>
              <div className="text-gray-600">
                <p>{businessData.address || 'Business Address'}</p>
                <p>{businessData.phone || 'Phone Number'}</p>
                <p>{businessData.email || 'Email Address'}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h2>
              <div className="text-gray-600">
                <p><strong>Invoice #:</strong> {invoice.invoice_number}</p>
                <p><strong>Date:</strong> {new Date(invoice.issue_date).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To:</h3>
            <div className="bg-gray-50 p-4">
              <p className="font-semibold text-gray-800">{invoice.customer_name}</p>
              <p className="text-gray-600">{invoice.customer_email}</p>
              <p className="text-gray-600">{invoice.customer_phone}</p>
              <p className="text-gray-600">{invoice.customer_address}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Description</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qty</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Unit Price</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">{item.description}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">₦{item.unit_price?.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      ₦{(item.quantity * item.unit_price)?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium">Subtotal:</span>
                <span>₦{calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium">VAT (7.5%):</span>
                <span>₦{calculateTax().toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-lg">
                <span>Total:</span>
                <span>₦{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes:</h3>
              <div className="bg-gray-50 p-4">
                <p className="text-gray-700">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Payment Terms */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Terms:</h3>
            <div className="text-gray-600 space-y-1">
              <p>• Payment is due within 30 days of invoice date</p>
              <p>• Late payments may incur additional charges</p>
              <p>• Please include invoice number with payment</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200 text-gray-500">
            <p>Thank you for your business!</p>
            <p className="text-sm mt-2">This is a computer-generated invoice.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;