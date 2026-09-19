import apiClient from './api';

export const candidateApi = {
  async getProfile() {
    return apiClient.get('/candidates/me');
  },

  async updateProfile(profileData) {
    return apiClient.put('/candidates/me', profileData);
  },

  async uploadResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    return apiClient.post('/candidates/me/resume', formData);
  }
};

export default candidateApi;
