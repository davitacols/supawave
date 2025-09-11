// import ErrorHandler from './errorHandler'; // Unused for now

const API_BASE_URL = 'https://supawave-backend-b77auzq28-davitacols-projects.vercel.app/api';
console.log('🔗 API Base URL:', API_BASE_URL);

// Clear expired tokens on app load
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        console.log('🔄 Clearing expired token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    } catch (e) {
      console.log('🔄 Clearing invalid token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }
}

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

export const storesAPI = {
  getStores: () => api.get('/stores/'),
  createStore: (data) => api.post('/stores/', data),
  updateStore: (id, data) => api.put(`/stores/${id}/`, data),
  deleteStore: (id) => api.delete(`/stores/${id}/`),
  setMainStore: (id) => api.post(`/stores/${id}/set_main/`),
  getStoreInventory: (id) => api.get(`/stores/${id}/inventory/`),
  addProductToStore: (storeId, data) => api.post(`/stores/${storeId}/add-product/`, data),
  getTransfers: () => api.get('/transfers/'),
  createTransfer: (data) => api.post('/transfers/', data),
  approveTransfer: (id) => api.post(`/transfers/${id}/approve/`),
  completeTransfer: (id) => api.post(`/transfers/${id}/complete/`),
  cancelTransfer: (id) => api.post(`/transfers/${id}/cancel/`),
};

export const marketplaceAPI = {
  getListings: () => api.get('/marketplace/listings/'),
  createListing: (data) => api.post('/marketplace/listings/', data),
  getMyListings: () => api.get('/marketplace/listings/my_listings/'),
  makeOffer: (listingId, data) => api.post(`/marketplace/listings/${listingId}/make_offer/`, data),
  getOffers: () => api.get('/marketplace/offers/'),
  acceptOffer: (offerId) => api.post(`/marketplace/offers/${offerId}/accept/`),
  rejectOffer: (offerId) => api.post(`/marketplace/offers/${offerId}/reject/`),
  getGroupBuys: () => api.get('/marketplace/group-buys/'),
  createGroupBuy: (data) => api.post('/marketplace/group-buys/', data),
  joinGroupBuy: (groupBuyId, data) => api.post(`/marketplace/group-buys/${groupBuyId}/join/`, data),
  getSuppliers: () => api.get('/marketplace/suppliers/'),
  createSupplier: (data) => api.post('/marketplace/suppliers/', data),
  addSupplierReview: (supplierId, data) => api.post(`/marketplace/suppliers/${supplierId}/add_review/`, data),
};

export const reportsAPI = {
  getDailyReport: (date) => api.get(`/reports/daily/?date=${date}`),
  getMonthlyReport: (month, year) => api.get(`/reports/monthly/?month=${month}&year=${year}`),
  getYearlyReport: (year) => api.get(`/reports/yearly/?year=${year}`),
  exportDailyCSV: (date) => `/reports/export/daily/?date=${date}`,
  exportMonthlyCSV: (month, year) => `/reports/export/monthly/?month=${month}&year=${year}`,
  exportYearlyCSV: (year) => `/reports/export/yearly/?year=${year}`,
};

export { api };
export default api;