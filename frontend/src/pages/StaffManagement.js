import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, EyeIcon, UserGroupIcon,
  ShieldCheckIcon, ClockIcon, CheckCircleIcon, KeyIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { authAPI } from '../utils/api';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [activeTab, setActiveTab] = useState('staff');
  const [showModal, setShowModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffActivity, setStaffActivity] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'cashier',
    password: '',
    permissions: {
      can_view_reports: false,
      can_manage_inventory: false,
      can_process_returns: false,
      can_give_discounts: false,
      can_manage_customers: false,
      can_view_sales_history: false
    }
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await authAPI.getStaff();
      let staffData = [];
      if (response?.data?.results) {
        staffData = response.data.results;
      } else if (response?.data?.data) {
        staffData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        staffData = response.data;
      } else if (response?.results) {
        staffData = response.results;
      } else if (Array.isArray(response?.data)) {
        staffData = response.data;
      } else if (Array.isArray(response)) {
        staffData = response;
      }
      
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
    }
  };

  const fetchStaffActivity = async (staffId) => {
    try {
      setLoading(true);
      const mockActivity = [
        { id: 1, action: 'Login', timestamp: new Date().toISOString(), details: 'Logged into system' },
        { id: 2, action: 'Sale', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Processed sale #12345 - ₦15,000' },
        { id: 3, action: 'Inventory', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Updated product stock' },
      ];
      setStaffActivity(mockActivity);
    } catch (error) {
      console.error('Error fetching staff activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let submitData = formData;
      
      if (profileImage) {
        const formDataWithImage = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'permissions') {
            formDataWithImage.append(key, JSON.stringify(formData[key]));
          } else {
            formDataWithImage.append(key, formData[key]);
          }
        });
        formDataWithImage.append('profile_image', profileImage);
        submitData = formDataWithImage;
      }
      
      if (editingStaff) {
        await authAPI.updateStaff(editingStaff.id, submitData);
      } else {
        await authAPI.createStaff(submitData);
      }
      fetchStaff();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving staff:', error);
      
      let errorMessage = 'Error saving staff member';
      if (error.response?.data) {
        const errors = error.response.data;
        if (errors.username) {
          errorMessage = 'Username already exists. Please choose a different username.';
        } else if (errors.email) {
          errorMessage = 'Email already exists. Please use a different email.';
        } else {
          errorMessage = Object.values(errors).flat().join(', ');
        }
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this staff member? This action cannot be undone.')) {
      try {
        await authAPI.deleteStaff(id);
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Error removing staff member');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      role: 'cashier',
      password: '',
      permissions: {
        can_view_reports: false,
        can_manage_inventory: false,
        can_process_returns: false,
        can_give_discounts: false,
        can_manage_customers: false,
        can_view_sales_history: false
      }
    });
    setEditingStaff(null);
    setProfileImage(null);
    setImagePreview(null);
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const openModal = (staffMember = null) => {
    if (staffMember) {
      setFormData({ 
        ...staffMember, 
        password: '',
        permissions: staffMember.permissions || {
          can_view_reports: false,
          can_manage_inventory: false,
          can_process_returns: false,
          can_give_discounts: false,
          can_manage_customers: false,
          can_view_sales_history: false
        }
      });
      setEditingStaff(staffMember);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const openActivityModal = (staffMember) => {
    setSelectedStaff(staffMember);
    fetchStaffActivity(staffMember.id);
    setShowActivityModal(true);
  };

  const getFilteredStaff = () => {
    if (!Array.isArray(staff)) return [];
    
    let filtered = staff;
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const tabs = [
    { id: 'staff', name: 'Staff Members', icon: UserGroupIcon, count: Array.isArray(staff) ? staff.length : 0 },
    { id: 'roles', name: 'Roles & Permissions', icon: ShieldCheckIcon, count: 3 },
    { id: 'activity', name: 'Activity Log', icon: ClockIcon, count: 0 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1">Manage team members, roles, and permissions</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'staff' && (
        <StaffTab
          staff={getFilteredStaff()}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          onEdit={openModal}
          onDelete={handleDelete}
          onViewActivity={openActivityModal}
        />
      )}

      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'activity' && <ActivityTab />}

      {/* Modals */}
      {showModal && (
        <StaffModal
          formData={formData}
          setFormData={setFormData}
          editingStaff={editingStaff}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          loading={loading}
          onImageChange={handleImageChange}
          imagePreview={imagePreview}
        />
      )}

      {showActivityModal && selectedStaff && (
        <ActivityModal
          staff={selectedStaff}
          activity={staffActivity}
          onClose={() => setShowActivityModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

const StaffTab = ({ 
  staff, searchTerm, setSearchTerm, roleFilter, setRoleFilter,
  onEdit, onDelete, onViewActivity 
}) => (
  <div className="space-y-6">
    {/* Filters */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff members..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
        </select>
      </div>
    </div>

    {/* Staff List */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Team Members ({staff.length})</h2>
      </div>
      
      {staff.length === 0 ? (
        <div className="p-12 text-center">
          <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
          <p className="text-gray-500">Add your first team member to get started</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {staff.map((member) => (
            <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium overflow-hidden">
                    {member.profile_image ? (
                      <img src={member.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{member.first_name?.charAt(0)}{member.last_name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {member.role?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>@{member.username}</span>
                      <span>{member.email}</span>
                      {member.phone_number && <span>{member.phone_number}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.is_active_staff ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {member.is_active_staff ? 'Active' : 'Inactive'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Last: {member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewActivity(member)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="View Activity"
                    >
                      <ClockIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(member)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit Staff"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(member.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove Staff"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const RolesTab = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Roles & Permissions</h2>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            role: 'Owner',
            description: 'Full system access and control',
            permissions: ['All Permissions', 'Manage Staff', 'View All Reports', 'System Settings', 'Financial Data'],
            color: 'purple'
          },
          {
            role: 'Manager',
            description: 'Supervisory access with most permissions',
            permissions: ['Manage Inventory', 'View Reports', 'Manage Customers', 'Process Returns', 'Give Discounts'],
            color: 'blue'
          },
          {
            role: 'Cashier',
            description: 'Basic operational access',
            permissions: ['Process Sales', 'View Products', 'Basic Customer Info', 'Print Receipts'],
            color: 'green'
          }
        ].map((roleInfo, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${
                roleInfo.color === 'purple' ? 'bg-purple-100' :
                roleInfo.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <ShieldCheckIcon className={`h-6 w-6 ${
                  roleInfo.color === 'purple' ? 'text-purple-600' :
                  roleInfo.color === 'blue' ? 'text-blue-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{roleInfo.role}</h3>
                <p className="text-sm text-gray-500">{roleInfo.description}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions:</h4>
              <ul className="space-y-1">
                {roleInfo.permissions.map((permission, i) => (
                  <li key={i} className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ActivityTab = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
    </div>
    <div className="p-6">
      <div className="text-center py-12">
        <ClockIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Tracking</h3>
        <p className="text-gray-500">Staff activity logs will appear here</p>
      </div>
    </div>
  </div>
);

const StaffModal = ({ formData, setFormData, editingStaff, onSubmit, onClose, loading, onImageChange, imagePreview }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </h2>
      </div>
      
      <form onSubmit={onSubmit} className="p-6 space-y-6">
        {/* Profile Image */}
        <div>
          <h3 className="text-lg font-medium mb-4">Profile Photo</h3>
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-xs">Photo</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
                id="profile-image"
              />
              <label
                htmlFor="profile-image"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Photo
              </label>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB</p>
            </div>
          </div>
        </div>
        
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
            </select>
          </div>
        </div>

        {/* Password */}
        <div>
          <h3 className="text-lg font-medium mb-4">Security</h3>
          <input
            type="password"
            placeholder={editingStaff ? "New Password (leave blank to keep current)" : "Password"}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={!editingStaff}
          />
        </div>

        {/* Permissions */}
        {formData.role === 'manager' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, [key]: e.target.checked }
                    })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : (editingStaff ? 'Update Staff' : 'Add Staff')}
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

const ActivityModal = ({ staff, activity, onClose, loading }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Activity Log - {staff.first_name} {staff.last_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No activity recorded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{item.action}</p>
                      <p className="text-sm text-gray-600">{item.details}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default StaffManagement;