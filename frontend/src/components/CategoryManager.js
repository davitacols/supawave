import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../utils/api';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const CategoryManager = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await inventoryAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await inventoryAPI.createCategory({ name: newCategory });
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Manage Categories</h3>
        
        <form onSubmit={handleAdd} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Category name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="space-y-2 mb-4">
          {categories.map((category) => (
            <div key={category.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{category.name}</span>
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

export default CategoryManager;