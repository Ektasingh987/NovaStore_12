import axiosClient from '../api/axiosClient';

export const authService = {
  login: async (credentials) => {
    const response = await axiosClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data) => {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await axiosClient.post('/auth/logout', { refreshToken });
    } catch {
      // Best-effort logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authUser');
    }
  },

  getMe: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },
};
