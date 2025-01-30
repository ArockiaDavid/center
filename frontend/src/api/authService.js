import axios from 'axios';

const API_URL = 'http://localhost:3007';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request made but no response received
      return Promise.reject({
        message: 'Unable to connect to server. Please check your internet connection.'
      });
    } else {
      // Error in request setup
      return Promise.reject({
        message: 'An error occurred while processing your request.'
      });
    }
  }
);

const authService = {
  login: async (email, password, role = 'user') => {
    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
        role
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.message || 'Failed to login';
    }
  },

  signup: async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error.message || 'Failed to signup';
    }
  },

  forgotPassword: async (email, newPassword, role = 'user') => {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', {
        email,
        newPassword,
        role
      });
      return response.data;
    } catch (error) {
      throw error.message || 'Failed to process forgot password request';
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await axiosInstance.post('/auth/reset-password', {
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error.message || 'Failed to reset password';
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;
