/**
 * Base HTTP API Client for Recruitment ATS
 */
const API_BASE = '/api/v1';

const apiClient = {
  getToken() {
    return localStorage.getItem('ats_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('ats_token', token);
    } else {
      localStorage.removeItem('ats_token');
    }
  },

  getUser() {
    const userStr = localStorage.getItem('ats_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('ats_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ats_user');
    }
  },

  clearAuth() {
    localStorage.removeItem('ats_token');
    localStorage.removeItem('ats_user');
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          this.clearAuth();
          // Optional redirect to login
          if (!window.location.pathname.includes('/login.html')) {
            window.location.href = '/pages/login.html?expired=1';
          }
        }
        const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err.message);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  async optimisticRequest(apiCallFn, optimisticUpdateFn, rollbackFn, successMessage = null) {
    try {
      if (typeof optimisticUpdateFn === 'function') {
        optimisticUpdateFn();
      }
      const response = await apiCallFn();
      if (successMessage && window.toast) {
        window.toast.success(successMessage);
      }
      return response;
    } catch (err) {
      if (typeof rollbackFn === 'function') {
        rollbackFn(err);
      }
      if (window.toast) {
        window.toast.error(`Action failed: ${err.message}. Changes rolled back.`);
      } else {
        alert(`Action failed: ${err.message}. Changes rolled back.`);
      }
      throw err;
    }
  }
};

window.apiClient = apiClient;
