import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  refresh: (refreshToken) => api.post('/auth/refresh/', { refresh: refreshToken }),
  getBusiness: () => api.get('/auth/business/'),
  updateBusiness: (data) => api.put('/auth/business/', data),
  getCurrentUser: () => api.get('/auth/me'),
  getStaff: () => api.get('/auth/staff/'),
  createStaff: (data) => api.post('/auth/staff/', data),
  updateStaff: (id, data) => api.put(`/auth/staff/${id}/`, data),
  deleteStaff: (id) => api.delete(`/auth/staff/${id}/`),
};

// Inventory API
export const inventoryAPI = {
  getProducts: (params = '') => api.get(`/inventory/products/?${params}`),
  createProduct: (data) => api.post('/inventory/products/', data),
  updateProduct: (id, data) => api.put(`/inventory/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/inventory/products/${id}/`),
  getCategories: () => api.get('/inventory/categories/'),
  getSuppliers: () => api.get('/inventory/suppliers/'),
  getLowStock: () => api.get('/inventory/products/low-stock/'),
  getLowStockProducts: () => api.get('/inventory/products/low-stock/'),
  getAlerts: () => api.get('/inventory/alerts/'),
  getSmartReorder: () => api.get('/inventory/smart-reorder/'),
  getStockTakes: () => api.get('/inventory/stock-takes/'),
  getStockTake: (id) => api.get(`/inventory/stock-takes/${id}/`),
  updateStockTake: (id, data) => api.put(`/inventory/stock-takes/${id}/`, data),
  updateStockTakeCount: (id, data) => api.post(`/inventory/stock-takes/${id}/count/`, data),
  barcodeSearch: (barcode) => api.get(`/inventory/products/barcode/${barcode}/`),
};

// Sales API
export const salesAPI = {
  getSales: () => api.get('/sales/'),
  createSale: (data) => api.post('/sales/', data),
  getAnalytics: () => api.get('/sales/analytics/'),
};

// Customers API
export const customersAPI = {
  getCustomers: () => api.get('/customers/'),
  createCustomer: (data) => api.post('/customers/', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}/`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}/`),
};

// Credit API
export const creditAPI = {
  getCreditSales: () => api.get('/credit/'),
  createCreditSale: (data) => api.post('/credit/', data),
  updateCreditSale: (id, data) => api.put(`/credit/${id}/`, data),
  recordPayment: (id, data) => api.post(`/credit/${id}/payment/`, data),
};

// Reports API
export const reportsAPI = {
  getSalesReport: (params) => api.get(`/reports/sales/?${params}`),
  getInventoryReport: () => api.get('/reports/inventory/'),
  getCustomerReport: () => api.get('/reports/customers/'),
  getProfitReport: (params) => api.get(`/reports/profit/?${params}`),
};

// Stores API
export const storesAPI = {
  getStores: () => api.get('/stores/'),
  createStore: (data) => api.post('/stores/', data),
  updateStore: (id, data) => api.put(`/stores/${id}/`, data),
  deleteStore: (id) => api.delete(`/stores/${id}/`),
  setMainStore: (id) => api.post(`/stores/${id}/set-main/`),
  getStoreInventory: (id, params = '') => api.get(`/stores/${id}/inventory/?${params}`),
  getTransfers: () => api.get('/transfers/'),
  createTransfer: (data) => api.post('/transfers/', data),
  approveTransfer: (id) => api.post(`/transfers/${id}/approve/`),
  completeTransfer: (id) => api.post(`/transfers/${id}/complete/`),
  cancelTransfer: (id) => api.post(`/transfers/${id}/cancel/`),
  getTransferDetails: (id) => api.get(`/transfers/${id}/`),
  getStoreInventory: (storeId) => api.get(`/transfers/store-inventory/${storeId}/`),
  assignManager: (storeId, managerId) => api.post(`/stores/${storeId}/assign-manager/`, { manager_id: managerId }),
  getAvailableManagers: () => api.get('/stores/available-managers/'),
  assignStaff: (storeId, staffId) => api.post(`/stores/${storeId}/assign-staff/`, { staff_id: staffId }),
  getStoreStaff: (storeId) => api.get(`/stores/${storeId}/staff/`),
  switchStore: (storeId) => api.post(`/stores/switch-store/${storeId}/`)
};

// Invoices API
export const invoiceAPI = {
  getInvoices: () => api.get('/invoices/'),
  createInvoice: (data) => api.post('/invoices/', data),
  updateInvoice: (id, data) => api.put(`/invoices/${id}/`, data),
  deleteInvoice: (id) => api.delete(`/invoices/${id}/`),
  getCustomers: () => api.get('/invoices/customers/'),
  createCustomer: (data) => api.post('/invoices/customers/', data),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params = '') => api.get(`/notifications/?${params}`),
  createNotification: (data) => api.post('/notifications/', data),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard/'),
  getSalesAnalytics: (params) => api.get(`/analytics/sales/?${params}`),
  getInventoryAnalytics: () => api.get('/analytics/inventory/'),
  getCustomerAnalytics: () => api.get('/analytics/customers/'),
};

// Marketplace API
export const marketplaceAPI = {
  getListings: () => api.get('/marketplace/listings/'),
  createListing: (data) => api.post('/marketplace/listings/', data),
  getSuppliers: () => api.get('/marketplace/suppliers/'),
  createSupplier: (data) => api.post('/marketplace/suppliers/', data),
  getGroupBuys: () => api.get('/marketplace/group-buys/'),
  getOffers: () => api.get('/marketplace/offers/'),
  makeOffer: (listingId, data) => api.post(`/marketplace/listings/${listingId}/make_offer/`, data),
  acceptOffer: (offerId) => api.post(`/marketplace/offers/${offerId}/accept/`),
  rejectOffer: (offerId) => api.post(`/marketplace/offers/${offerId}/reject/`),
};

// Dashboard API
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard/'),
  getStats: () => api.get('/dashboard/stats/'),
};

// WhatsApp API
export const whatsappAPI = {
  getIntegration: () => api.get('/whatsapp/integration/'),
  updateIntegration: (data) => api.put('/whatsapp/integration/', data),
  sendMessage: (data) => api.post('/whatsapp/send/', data),
  getMessages: () => api.get('/whatsapp/messages/'),
};

// Finance API
export const financeAPI = {
  getDashboard: () => api.get('/finance/dashboard'),
  getExpenses: (params = '') => api.get(`/finance/expenses?${params}`),
  createExpense: (data) => api.post('/finance/expenses', data),
  getCategories: () => api.get('/finance/categories'),
  getProfitLoss: (params = '') => api.get(`/finance/profit-loss?${params}`),
  getSalesReport: (params = '') => api.get(`/finance/sales-report?${params}`),
  getInventoryReport: () => api.get('/finance/inventory-report'),
  getTaxReport: (params = '') => api.get(`/finance/tax-report?${params}`),
};

// Export api as named export for backward compatibility
export { api };

// Staff API
export const staffAPI = {
  getAll: () => api.get('/staff'),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`)
};

export default api;