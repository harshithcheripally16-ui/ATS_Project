import apiClient from './api';

export const jobsApi = {
  async listJobs(filters = {}) {
    return apiClient.get('/jobs', filters);
  },

  async getMyJobs(page = 1, limit = 10, scope = 'all') {
    return apiClient.get('/jobs/my-jobs', { page, limit, scope });
  },

  async getJob(id) {
    return apiClient.get(`/jobs/${id}`);
  },

  async createJob(jobData) {
    return apiClient.post('/jobs', jobData);
  },

  async updateJob(id, jobData) {
    return apiClient.put(`/jobs/${id}`, jobData);
  },

  async deleteJob(id) {
    return apiClient.delete(`/jobs/${id}`);
  }
};

export default jobsApi;
