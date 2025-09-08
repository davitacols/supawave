import axios from 'axios';

const BASE_URL = 'http://192.168.0.183:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple token storage for demo
let authToken = null;

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const setAuthToken = (token) => {
  authToken = token;
};

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },
  
  getBusiness: async () => {
    const response = await api.get('/auth/business/');
    return response.data;
  }
};

export const inventoryAPI = {
  getProducts: async () => {
    const response = await api.get('/inventory/products/');
    return response.data;
  },
  
  createProduct: async (productData) => {
    const response = await api.post('/inventory/products/', productData);
    return response.data;
  },
  
  getLowStock: async () => {
    const response = await api.get('/inventory/products/low-stock/');
    return response.data;
  }
};

export const salesAPI = {
  createSale: async (saleData) => {
    const response = await api.post('/sales/', saleData);
    return response.data;
  },
  
  getSales: async () => {
    const response = await api.get('/sales/');
    return response.data;
  },
  
  getAnalytics: async () => {
    const response = await api.get('/sales/analytics/');
    return response.data;
  }
};

export default api;