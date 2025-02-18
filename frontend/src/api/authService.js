import axios from 'axios';
import config from '../config';

console.log('AuthService: Using API URL:', config.apiUrl);

const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('AuthService: Using API URL:', config.apiUrl);

  // Add a request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        // Verify token before adding to request
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          const expiryTime = tokenData.exp * 1000;
          const currentTime = Date.now();
          
          // If token is expired or will expire in next 5 minutes, trigger logout
          if (expiryTime - currentTime < 5 * 60 * 1000) {
            console.log('Token expired or expiring soon, logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject('Token expired');
          }
          
          config.headers.Authorization = `Bearer ${token}`;
        } catch (err) {
          console.error('Error verifying token:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject('Invalid token');
        }
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
  async (error) => {
    // Log the full error for debugging
    console.error('Axios interceptor error:', {
      error,
      response: error.response,
      request: error.request,
      config: error.config
    });

    if (error.response) {
      // Handle 401 errors
      if (error.response.status === 401) {
        // Don't handle 401s for login attempts
        if (error.config.url.includes('/auth/login')) {
          return Promise.reject(error);
        }

        // Check if token is expired
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const expiryTime = tokenData.exp * 1000;
            const currentTime = Date.now();
            const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

            if (expiryTime - currentTime < bufferTime) {
              console.log('Token expired or expiring soon, logging out');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
              return Promise.reject({
                response: {
                  data: {
                    message: 'Session expired. Please login again.',
                    details: { type: 'session_expired' }
                  }
                }
              });
            }
          } catch (err) {
            console.error('Error checking token expiry:', err);
          }
        }

        // Handle other 401 errors
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject({
          response: {
            data: {
              message: 'Authentication failed. Please login again.',
              details: { type: 'auth_failed' }
            }
          }
        });
      }
      return Promise.reject(error);
    } else if (error.request) {
      // Request made but no response received
      return Promise.reject({
        response: {
          data: {
            message: 'Unable to connect to server. Please check your network connection.',
            details: { type: 'network_error' }
          }
        }
      });
    } else {
      // Error in request setup
      return Promise.reject({
        response: {
          data: {
            message: 'An error occurred while processing your request.',
            details: { type: 'request_error' }
          }
        }
      });
    }
  }
);

const authService = {
  login: async (email, password, role = 'user') => {
    try {
      console.log('AuthService: Attempting login with:', { email, role });
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
        role
      });
      console.log('AuthService: Login response:', response);
      const { data } = response;
      
      // Validate response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      if (!data.token || typeof data.token !== 'string') {
        throw new Error('No valid token received from server');
      }
      
      if (!data.user || typeof data.user !== 'object') {
        throw new Error('No valid user data received from server');
      }
      
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Store new auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Verify storage was successful
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!storedToken || !storedUser) {
        throw new Error('Failed to store authentication data');
      }
      
      return data;
    } catch (error) {
      console.error('AuthService: Login error:', error);
      if (error.response) {
        console.error('AuthService: Server response:', error.response.data);
        
        // Use server's error message if available
        if (error.response.data.message) {
          throw {
            message: error.response.data.message,
            details: error.response.data.details || {}
          };
        }
        
        // Fallback error messages based on status
        switch (error.response.status) {
          case 404:
            throw {
              message: 'Account not found. Please check your email and try again.',
              details: { type: 'account_not_found' }
            };
          case 401:
            throw {
              message: 'Invalid password. Please try again.',
              details: { type: 'invalid_password' }
            };
          case 400:
            throw {
              message: 'Invalid request. Please check your input.',
              details: { type: 'invalid_request' }
            };
          default:
            throw {
              message: 'Authentication failed. Please try again.',
              details: { type: 'auth_failed' }
            };
        }
      }
      if (error.request) {
        console.error('AuthService: Network error:', error.request);
        throw {
          message: 'Unable to connect to server. Please check your network connection.',
          details: { type: 'network_error' }
        };
      }
      throw {
        message: 'An unexpected error occurred. Please try again.',
        details: { type: 'unknown_error', error: error.toString() }
      };
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
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      console.log('No token or user found');
      return false;
    }
    
    try {
      const userData = JSON.parse(user);
      if (!userData.role) {
        console.log('No user role found');
        return false;
      }
      
      // Decode and verify token
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('Invalid token format');
        return false;
      }
      
      const tokenData = JSON.parse(atob(tokenParts[1]));
      console.log('Token data:', {
        ...tokenData,
        exp: new Date(tokenData.exp * 1000).toLocaleString()
      });
      
      // Verify token payload
      if (!tokenData.userId || !tokenData.email || !tokenData.role) {
        console.log('Missing token data');
        return false;
      }
      
      // Verify token expiry with buffer time
      const expiryTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
      
      if (expiryTime - currentTime < bufferTime) {
        console.log('Token expired or expiring soon:', {
          expiryTime: new Date(expiryTime).toLocaleString(),
          currentTime: new Date(currentTime).toLocaleString(),
          timeLeft: Math.round((expiryTime - currentTime) / 1000),
          bufferTime: Math.round(bufferTime / 1000)
        });
        this.logout();
        return false;
      }
      
      // Verify role matches
      if (tokenData.role !== userData.role) {
        console.log('Role mismatch:', { token: tokenData.role, user: userData.role });
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error verifying auth:', err);
      return false;
    }
  },
  
  getAuthToken: () => {
    return localStorage.getItem('token');
  }
};

export default authService;
