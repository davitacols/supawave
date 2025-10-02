import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, MagnifyingGlassIcon, UserIcon, CreditCardIcon,
  ShoppingBagIcon, PhoneIcon, MapPinIcon, PencilIcon, TrashIcon, EyeIcon
} from '@heroicons/react/24/outline';
import { invoiceAPI } from '../utils/api';
import api from '../utils/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [creditCustomers, setCreditCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
    fetchCreditCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await invoiceAPI.getCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditCustomers = async () => {
    try {
      const response = await api.get('/credit/customers/');
      setCreditCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching credit customers:', error);
      setCreditCustomers([]);
    }
  };

  const createCustomer = async (data) => {
    try {
      await invoiceAPI.createCustomer(data);
      fetchCustomers();
      setShowModal(false);
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const updateCustomer = async (id, data) => {
    try {
      await invoiceAPI.updateCustomer(id, data);
      fetchCustomers();
      setShowModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const deleteCustomer = async (id) => {
    if (window.confirm('Delete this customer? This action cannot be undone.')) {
      try {
        await invoiceAPI.deleteCustomer(id);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const getFilteredCustomers = () => {
    let filtered = [];
    
    if (activeTab === 'all') {
      filtered = customers;
    } else if (activeTab === 'credit') {
      filtered = creditCustomers;
    }

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-1">Manage your customer database and credit accounts</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'all', name: 'All Customers', icon: UserIcon, count: customers.length },
              { id: 'credit', name: 'Credit Customers', icon: CreditCardIcon, count: creditCustomers.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 text-xs font-medium rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {activeTab === 'all' ? 'All Customers' : 'Credit Customers'}
          </h2>
        </div>
        
        {getFilteredCustomers().length === 0 ? (
          <div className="p-12 text-center">
            <UserIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'No customers match your search criteria' : 'Start by adding your first customer'}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {getFilteredCustomers().map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                isCredit={activeTab === 'credit'}
                onEdit={() => {
                  setSelectedCustomer(customer);
                  setShowModal(true);
                }}
                onDelete={() => deleteCustomer(customer.id)}
                onViewDetails={() => {
                  setSelectedCustomer(customer);
                  setShowDetailModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowModal(false);
            setSelectedCustomer(null);
          }}
          onCreate={createCustomer}
          onUpdate={updateCustomer}
        />
      )}

      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          isCredit={activeTab === 'credit'}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

const CustomerCard = ({ customer, isCredit, onEdit, onDelete, onViewDetails }) => (
  <div className="p-6 hover:bg-gray-50 transition-colors">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
            {customer.phone && (
              <div className="flex items-center space-x-1">
                <PhoneIcon className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && <span>{customer.email}</span>}
            {customer.address && (
              <div className="flex items-center space-x-1">
                <MapPinIcon className="h-4 w-4" />
                <span className="truncate">{customer.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        {isCredit && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Credit Balance</p>
            <p className="text-lg font-semibold text-red-600">
              ₦{customer.current_balance?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500">
              Limit: ₦{customer.credit_limit?.toLocaleString() || 0}
            </p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            title="Edit Customer"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete Customer"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const CustomerModal = ({ customer, onClose, onCreate, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (customer) {
      onUpdate(customer.id, formData);
    } else {
      onCreate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows={2}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {customer ? 'Update' : 'Add'} Customer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerDetailModal = ({ customer, isCredit, onClose }) => {
  const [customerSales, setCustomerSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerSales();
  }, [customer.id]);

  const fetchCustomerSales = async () => {
    try {
      setCustomerSales([]);
    } catch (error) {
      console.error('Error fetching customer sales:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{customer.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{customer.email || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{customer.address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Credit Information */}
          {isCredit && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900">Credit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">Current Balance</p>
                  <p className="text-xl font-semibold text-red-700">
                    ₦{customer.current_balance?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Credit Limit</p>
                  <p className="text-xl font-semibold text-blue-700">
                    ₦{customer.credit_limit?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-600">Available Credit</p>
                  <p className="text-xl font-semibold text-green-700">
                    ₦{customer.available_credit?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Purchase History */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Purchase History</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : customerSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingBagIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No purchase history available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerSales.map((sale, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Sale #{sale.id}</p>
                      <p className="text-sm text-gray-500">{sale.date}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₦{sale.amount?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;