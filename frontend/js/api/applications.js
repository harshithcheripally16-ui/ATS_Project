/**
 * Applications API Module
 */
const applicationsApi = {
  async applyToJob(jobId) {
    return apiClient.post('/applications', { job_id: jobId });
  },

  async getMyApplications(page = 1, limit = 10, status = '') {
    const params = { page, limit };
    if (status) params.status = status;
    return apiClient.get('/applications/me', params);
  },

  async getAllApplications(params = {}) {
    return apiClient.get('/applications', params);
  },

  async getJobApplicants(jobId, page = 1, limit = 10, status = '', search = '', sort = '') {
    const params = { page, limit };
    if (status) params.status = status;
    if (search) params.search = search;
    if (sort) params.sort = sort;
    if (!jobId) {
      return this.getAllApplications(params);
    }
    return apiClient.get(`/jobs/${jobId}/applications`, params);
  },

  async updateStatus(appId, targetStatus, remarks = '') {
    return apiClient.patch(`/applications/${appId}/status`, {
      status: targetStatus,
      recruiter_remarks: remarks
    });
  },

  async provideOfferLetter(appId, offerData) {
    return apiClient.post(`/applications/${appId}/offer`, offerData);
  },

  async getOfferLetter(appId) {
    return apiClient.get(`/applications/${appId}/offer`);
  },

  async respondToOffer(appId, status, notes = '') {
    return apiClient.patch(`/applications/${appId}/offer/respond`, {
      status,
      notes
    });
  }
};

window.applicationsApi = applicationsApi;
