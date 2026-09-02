import axiosClient from '../api/axiosClient';

export const categoriesService = {
  getCategories: async () => {
    const response = await axiosClient.get('/categories');
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await axiosClient.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (formData) => {
    const response = await axiosClient.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateCategory: async (id, formData) => {
    const response = await axiosClient.patch(`/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  },
};
