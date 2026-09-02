import axiosClient from '../api/axiosClient';

export const ordersService = {
  getOrders: async (params = {}) => {
    const response = await axiosClient.get('/admin/orders', { params });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await axiosClient.get(`/admin/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, status, note = '') => {
    const response = await axiosClient.patch(`/admin/orders/${id}/status`, { status, note });
    return response.data;
  },
};
