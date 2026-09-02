import axiosClient from '../api/axiosClient';

export const productsService = {
  getProducts: async (params = {}) => {
    const response = await axiosClient.get('/products', { params });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (formData) => {
    const response = await axiosClient.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateProduct: async (id, formData) => {
    const response = await axiosClient.patch(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await axiosClient.delete(`/products/${id}`);
    return response.data;
  },
};
