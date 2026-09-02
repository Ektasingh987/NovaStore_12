import axiosClient from '../api/axiosClient';

export const dashboardService = {
  getStats: async () => {
    const response = await axiosClient.get('/admin/stats/overview');
    return response.data;
  },
};
