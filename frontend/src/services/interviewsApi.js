import apiClient from './api';

export const interviewsApi = {
  async scheduleInterview(appId, date, time, mode = 'online', notes = '') {
    return apiClient.post('/interviews', {
      application_id: appId,
      date,
      time,
      mode,
      notes
    });
  },

  async getMyInterviews(page = 1, limit = 10) {
    return apiClient.get('/interviews/me', { page, limit });
  },

  async getRecruiterInterviews(page = 1, limit = 10) {
    return apiClient.get('/interviews/recruiter', { page, limit });
  },

  async updateInterview(interviewId, updateData) {
    return apiClient.patch(`/interviews/${interviewId}`, updateData);
  }
};

export default interviewsApi;
