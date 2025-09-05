import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, CreditCardIcon, ExclamationTriangleIcon, BanknotesIcon, UsersIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const Credit = () => {
  const [dashboard, setDashboard] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    fetchCustomers();
    fetchSales();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/credit/dashboard/');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/credit/customers/');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await api.get('/credit/sales/');
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const createCustomer = async (data) => {
    try {
      console.log('Creating customer:', data);
      const response = await api.post('/credit/customers/', data);
      console.log('Customer created:', response);
      fetchCustomers();
      fetchDashboard();
      setShowCustomerModal(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 shadow rounded-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Credit Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage customer credit sales and debt collection</p>
          </div>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: CreditCardIcon },
              { id: 'customers', name: 'Customers', icon: UsersIcon },
              { id: 'sales', name: 'Credit Sales', icon: BanknotesIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && (
        <DashboardTab dashboard={dashboard} />
      )}
      
      {activeTab === 'customers' && (
        <CustomersTab customers={customers} onRefresh={fetchCustomers} />
      )}
      
      {activeTab === 'sales' && (
        <SalesTab sales={sales} onRefresh={fetchSales} />
      )}

      {/* Modals */}
      {showCustomerModal && (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onCreate={createCustomer}
        />
      )}
    </div>
  );
};

const DashboardTab = ({ dashboard }) => {
  if (!dashboard) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div className="bg-white p-4 sm:p-6 shadow rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <BanknotesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
          </div>
          <div className="ml-3 sm:ml-5 w-0 flex-1">
            <dl>
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Outstanding</dt>
              <dd className="text-sm sm:text-lg font-medium text-gray-900">₦{dashboard.total_outstanding.toLocaleString()}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Overdue Amount</dt>
              <dd className="text-lg font-medium text-gray-900">₦{dashboard.overdue_amount.toLocaleString()}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CreditCardIcon className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Weekly Collections</dt>
              <dd className="text-lg font-medium text-gray-900">₦{dashboard.weekly_collections.toLocaleString()}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <UsersIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Customers with Debt</dt>
              <dd className="text-lg font-medium text-gray-900">{dashboard.customers_with_debt}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomersTab = ({ customers }) => {
  return (
    <div className="bg-white shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Credit Customers</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available Credit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₦{customer.credit_limit.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₦{customer.current_balance.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₦{customer.available_credit.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold ${
                    customer.is_overdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {customer.is_overdue ? 'Overdue' : 'Good'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SalesTab = ({ sales }) => {
  return (
    <div className="bg-white shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Credit Sales</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{sale.customer_name}</div>
                  <div className="text-sm text-gray-500">{sale.customer_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₦{sale.total_amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₦{sale.amount_paid.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₦{sale.balance_due.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(sale.due_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold ${
                    sale.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sale.is_paid ? 'Paid' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CustomerModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    credit_limit: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Credit Customer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows={2}
              className="w-full border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₦)</label>
            <input
              type="number"
              value={formData.credit_limit}
              onChange={(e) => setFormData({...formData, credit_limit: e.target.value})}
              className="w-full border border-gray-300 px-3 py-2"
              min="0"
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 hover:bg-blue-700"
            >
              Add Customer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Credit;