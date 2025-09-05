import { useState } from 'react';
import api from '../services/api';

export const useBarcode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lookupBarcode = async (barcode) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/inventory/products/barcode/${barcode}/`);
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Barcode lookup failed');
      setLoading(false);
      return null;
    }
  };

  return {
    lookupBarcode,
    loading,
    error
  };
};