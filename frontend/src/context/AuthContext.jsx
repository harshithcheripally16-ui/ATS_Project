import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => apiClient.getUser());
  const [token, setToken] = useState(() => apiClient.getToken());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!apiClient.getToken()) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      if (res.data && res.data.user) {
        setUser(res.data.user);
        apiClient.setUser(res.data.user);
      }
    } catch (err) {
      console.warn('Could not refresh user session:', err.message);
      if (err.message && err.message.toLowerCase().includes('unauthorized')) {
        apiClient.clearAuth();
        setUser(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.data && res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      apiClient.setToken(res.data.token);
      apiClient.setUser(res.data.user);
    }
    return res;
  };

  const register = async (data) => {
    return authApi.register(data);
  };

  const verifyOtp = async (email, otp, purpose = 'first_login_verify') => {
    const res = await authApi.verifyOtp(email, otp, purpose);
    if (res.data && res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      apiClient.setToken(res.data.token);
      apiClient.setUser(res.data.user);
    }
    return res;
  };

  const logout = () => {
    apiClient.clearAuth();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    apiClient.setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role: user?.role || null,
    login,
    register,
    verifyOtp,
    logout,
    updateUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
