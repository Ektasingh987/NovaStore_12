import axiosClient from '../api/axiosClient';

export const usersService = {
  getUsers: async (params = {}) => {
    const response = await axiosClient.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await axiosClient.get(`/admin/users/${id}`);
    return response.data;
  },

  getUserOrders: async (id, params = {}) => {
    const response = await axiosClient.get(`/admin/users/${id}/orders`, { params });
    return response.data;
  },

  updateUserStatus: async (id, isActive) => {
    const response = await axiosClient.patch(`/admin/users/${id}/status`, { isActive });
    return response.data;
  },
};
