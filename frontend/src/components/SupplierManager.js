import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../utils/api';
import { PlusIcon } from '@heroicons/react/24/outline';

const SupplierManager = ({ onClose }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({ name: '', contact: '' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await inventoryAPI.getSuppliers();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await inventoryAPI.createSupplier(formData);
      setFormData({ name: '', contact: '' });
      fetchSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Manage Suppliers</h3>
        
        <form onSubmit={handleAdd} className="mb-4 space-y-3">
          <input
            type="text"
            placeholder="Supplier name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Contact (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Supplier
          </button>
        </form>

        <div className="space-y-2 mb-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="p-2 bg-gray-50 rounded">
              <div className="font-medium">{supplier.name}</div>
              {supplier.contact && (
                <div className="text-sm text-gray-500">{supplier.contact}</div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SupplierManager;