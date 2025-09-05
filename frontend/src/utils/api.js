import ErrorHandler from './errorHandler';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.183:8000/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  const config = {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Only set Content-Type for non-FormData requests
  if (!(config.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.response = { status: response.status, data: errorData };
      throw error;
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return { data: null };
    }

    return { data: await response.json() };
  } catch (error) {
    if (!error.response) {
      // Network or other errors
      const networkError = new Error('Network connection failed');
      networkError.response = { status: 0 };
      throw networkError;
    }
    throw error;
  }
};

const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, data) => apiRequest(endpoint, { method: 'POST', body: data }),
  put: (endpoint, data) => apiRequest(endpoint, { method: 'PUT', body: data }),
  patch: (endpoint, data) => apiRequest(endpoint, { method: 'PATCH', body: data }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  getBusiness: () => api.get('/auth/business/'),
  updateBusiness: (data) => api.put('/auth/business/', data),
  getStaff: () => api.get('/auth/staff/'),
  createStaff: (data) => api.post('/auth/staff/', data),
  updateStaff: (id, data) => api.put(`/auth/staff/${id}/`, data),
  deleteStaff: (id) => api.delete(`/auth/staff/${id}/`),
};

export const inventoryAPI = {
  getProducts: (params = '') => api.get(`/inventory/products/?${params}`),
  createProduct: (data) => api.post('/inventory/products/', data),
  updateProduct: (id, data) => api.put(`/inventory/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/inventory/products/${id}/`),
  getLowStockProducts: () => api.get('/inventory/products/low-stock/'),
  getCategories: () => api.get('/inventory/categories/'),
  createCategory: (data) => api.post('/inventory/categories/', data),
  getSuppliers: () => api.get('/inventory/suppliers/'),
  createSupplier: (data) => api.post('/inventory/suppliers/', data),
  searchByBarcode: (barcode) => api.get(`/inventory/barcode-search/?barcode=${barcode}`),
  generateBarcode: (productId) => api.post(`/inventory/products/${productId}/generate-barcode/`),
};

export const salesAPI = {
  getSales: () => api.get('/sales/'),
  createSale: (data) => api.post('/sales/', data),
  getAnalytics: () => api.get('/sales/analytics/'),
  getReceipt: (saleId) => api.get(`/sales/receipt/${saleId}/`),
};

export const analyticsAPI = {
  getAdvancedAnalytics: () => api.get('/analytics/advanced/'),
  getReorderSuggestions: () => api.get('/inventory/smart-reorder/'),
  markAlertRead: (alertId) => api.post(`/analytics/alerts/${alertId}/read/`),
  getLiveMetrics: () => api.get('/analytics/live-metrics/'),
  getQuickStats: () => api.get('/analytics/quick-stats/'),
};

export const invoiceAPI = {
  getInvoices: () => api.get('/invoices/'),
  createInvoice: (data) => api.post('/invoices/', data),
  getInvoice: (id) => api.get(`/invoices/${id}/`),
  updateInvoice: (id, data) => api.put(`/invoices/${id}/`, data),
  getCustomers: () => api.get('/invoices/customers/'),
  createCustomer: (data) => api.post('/invoices/customers/', data),
  updateCustomer: (id, data) => api.put(`/invoices/customers/${id}/`, data),
  deleteCustomer: (id) => api.delete(`/invoices/customers/${id}/`),
};

export const barcodeAPI = {
  searchByBarcode: (barcode) => api.get(`/inventory/barcode-search/?barcode=${barcode}`),
  generateBarcode: (productId) => api.post(`/inventory/products/${productId}/generate-barcode/`),
};

export const notificationsAPI = {
  getNotifications: () => api.get('/notifications/'),
  markAsRead: (id) => api.patch(`/notifications/${id}/`, { is_read: true }),
  markAllAsRead: () => api.post('/notifications/mark-all-read/'),
};

export const whatsappAPI = {
  getConfig: () => api.get('/whatsapp/config/'),
  updateConfig: (data) => api.put('/whatsapp/config/', data),
  getTemplates: () => api.get('/whatsapp/templates/'),
  createTemplate: (data) => api.post('/whatsapp/templates/', data),
  getMessages: () => api.get('/whatsapp/messages/'),
  sendPromotion: (data) => api.post('/whatsapp/send-promotion/', data),
};

export const syncAPI = {
  getSyncData: (lastSync) => api.get(`/sync/data/?last_sync=${lastSync}`),
  uploadOfflineData: (data) => api.post('/sync/upload/', data),
  checkConnection: () => api.get('/sync/status/'),
};

export const paymentAPI = {
  getPlans: () => api.get('/payments/plans/'),
  getSubscriptionStatus: () => api.get('/payments/status/'),
  initiatePayment: (data) => api.post('/payments/initiate/', data),
  verifyPayment: (reference) => api.post('/payments/verify/', { reference }),
  cancelSubscription: () => api.post('/payments/cancel/'),
};

export default api;