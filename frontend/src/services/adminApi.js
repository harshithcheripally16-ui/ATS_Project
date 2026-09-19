import apiClient from './api';

export const adminApi = {
  async listUsers(page = 1, limit = 10, role = '', isActive = '', search = '') {
    const params = { page, limit };
    if (role) params.role = role;
    if (isActive !== '') params.is_active = isActive;
    if (search) params.search = search;
    return apiClient.get('/admin/users', params);
  },

  async createUser(data) {
    return apiClient.post('/admin/users', data);
  },

  async updateUser(userId, data) {
    return apiClient.put(`/admin/users/${userId}`, data);
  },

  async deleteUser(userId) {
    return apiClient.delete(`/admin/users/${userId}`);
  },

  async updateUserStatus(userId, isActive) {
    return apiClient.patch(`/admin/users/${userId}/status`, { is_active: isActive });
  },

  async listAllJobs(page = 1, limit = 10) {
    return apiClient.get('/admin/jobs', { page, limit });
  },

  async listCategories() {
    return apiClient.get('/admin/categories');
  },

  async createCategory(name, description = '') {
    return apiClient.post('/admin/categories', { name, description });
  },

  async updateCategory(categoryId, name, description = '') {
    return apiClient.put(`/admin/categories/${categoryId}`, { name, description });
  },

  async deleteCategory(categoryId) {
    return apiClient.delete(`/admin/categories/${categoryId}`);
  },

  async getStats() {
    return apiClient.get('/admin/stats');
  }
};

export default adminApi;
