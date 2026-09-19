import apiClient from './api';

export const authApi = {
  async register(data) {
    return apiClient.post('/auth/register', data);
  },

  async verifyEmail(token) {
    return apiClient.post('/auth/verify-email', { token });
  },

  async verifyOtp(email, otp, purpose = 'first_login_verify') {
    const res = await apiClient.post('/auth/verify-otp', { email, otp, purpose });
    if (res.data && res.data.token) {
      apiClient.setToken(res.data.token);
      apiClient.setUser(res.data.user);
    }
    return res;
  },

  async resendOtp(email, purpose = 'first_login_verify') {
    return apiClient.post('/auth/resend-otp', { email, purpose });
  },

  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data && res.data.token) {
      apiClient.setToken(res.data.token);
      apiClient.setUser(res.data.user);
    }
    return res;
  },

  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(data) {
    return apiClient.post('/auth/reset-password', data);
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    if (res.data && res.data.user) {
      apiClient.setUser(res.data.user);
    }
    return res;
  },

  logout() {
    apiClient.clearAuth();
  },

  getCurrentUser() {
    return apiClient.getUser();
  },

  isAuthenticated() {
    return !!apiClient.getToken();
  }
};

export default authApi;
