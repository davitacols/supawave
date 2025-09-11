// Debug utility to check API URL
export const debugAPI = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Login endpoint would be:', `${API_BASE_URL}/auth/login/`);
  return API_BASE_URL;
};

// Call this in browser console to check
window.debugAPI = debugAPI;