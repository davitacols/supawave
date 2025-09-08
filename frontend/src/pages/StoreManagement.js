import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, BuildingStorefrontIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { storesAPI } from '../utils/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settingMain, setSettingMain] = useState(null);
  const [assignManagerStore, setAssignManagerStore] = useState(null);
  const [managers, setManagers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager_name: ''
  });

  useEffect(() => {
    fetchStores();
    fetchManagers();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await storesAPI.getStores();
      
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        setStores([]);
        return;
      }
      
      // Handle both paginated and direct array responses
      let storesData;
      if (response.data.results) {
        // Paginated response
        storesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        storesData = response.data;
      } else {
        // Fallback
        storesData = [];
      }
      // Stores loaded successfully
      setStores(storesData);
      setFilteredStores(storesData);
    } catch (error) {
      console.error('Error fetching stores:', error);
      console.error('Error details:', error.response);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await storesAPI.createStore(formData);
      console.log('Store created:', response);
      setShowAddModal(false);
      setFormData({ name: '', address: '', phone: '', manager_name: '' });
      fetchStores();
    } catch (error) {
      console.error('Error adding store:', error);
      alert('Error creating store: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const setMainStore = async (storeId) => {
    setSettingMain(storeId);
    try {
      await storesAPI.setMainStore(storeId);
      fetchStores();
    } catch (error) {
      console.error('Error setting main store:', error);
    } finally {
      setSettingMain(null);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/staff/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const data = await response.json();
      const managerList = (data.results || data || []).filter(user => user.role === 'manager');
      setManagers(managerList);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const assignManager = async (storeId, managerId) => {
    try {
      await fetch(`http://localhost:8000/api/stores/${storeId}/assign-manager/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ manager_id: managerId })
      });
      
      setAssignManagerStore(null);
      fetchStores();
      alert('Manager assigned successfully!');
    } catch (error) {
      console.error('Error assigning manager:', error);
      alert('Error assigning manager');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Store Management</h1>
            <p className="text-gray-600">Manage your store locations</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Add Store</span>
          </Button>
        </div>
      </Card>

      {/* Search Bar */}
      <div className="bg-white p-4 shadow rounded-lg">
        <input
          type="text"
          placeholder="Search stores by name, address, or manager..."
          className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => {
            const term = e.target.value;
            setSearchTerm(term);
            const filtered = stores.filter(store => 
              store.name.toLowerCase().includes(term.toLowerCase()) ||
              store.address.toLowerCase().includes(term.toLowerCase()) ||
              (store.manager_name && store.manager_name.toLowerCase().includes(term.toLowerCase()))
            );
            setFilteredStores(filtered);
          }}
        />
      </div>

      {/* Stores List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : filteredStores.length === 0 ? (
        <Card className="p-12 text-center">
          <BuildingStorefrontIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No stores match your search criteria' : 'Add your first store to get started'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowAddModal(true)}>
              Add First Store
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Stores ({filteredStores.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredStores.map((store) => (
              <div key={store.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <BuildingStorefrontIcon className="h-10 w-10 text-gray-600" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{store.name}</h3>
                        {store.is_main_store && (
                          <Badge variant="success">Main Store</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{store.address}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        {store.phone && <span>📞 {store.phone}</span>}
                        <span>👤 {store.manager_name || 'No manager'}</span>
                        <Badge variant={store.is_active ? 'success' : 'error'}>
                          {store.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setAssignManagerStore(store)}
                    >
                      {store.manager_name ? 'Change Manager' : 'Assign Manager'}
                    </Button>
                    {!store.is_main_store && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setMainStore(store.id)}
                        disabled={settingMain === store.id}
                      >
                        {settingMain === store.id ? 'Setting...' : 'Set as Main'}
                      </Button>
                    )}
                    <Link 
                      to={`/stores/${store.id}/inventory`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      View Inventory
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Store Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Store">
          <form onSubmit={handleAddStore} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name *
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Name
              </label>
              <Input
                type="text"
                value={formData.manager_name}
                onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                {submitting && <LoadingSpinner size="sm" />}
                <span>{submitting ? 'Adding...' : 'Add Store'}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Manager Modal */}
      {assignManagerStore && (
        <Modal 
          isOpen={!!assignManagerStore} 
          onClose={() => setAssignManagerStore(null)} 
          title={`Assign Manager to ${assignManagerStore.name}`}
        >
          <div className="space-y-3">
            {managers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No managers available. Create manager accounts first.
              </p>
            ) : (
              managers.map(manager => (
                <div 
                  key={manager.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{manager.first_name} {manager.last_name}</p>
                    <p className="text-sm text-gray-500">{manager.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => assignManager(assignManagerStore.id, manager.id)}
                  >
                    Assign
                  </Button>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button
              variant="secondary"
              onClick={() => setAssignManagerStore(null)}
            >
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StoreManagement;