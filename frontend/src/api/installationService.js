import axios from 'axios';
import config from '../config';

class InstallationService {
  constructor() {
    this.api = axios.create({
      baseURL: `${config.apiUrl}/user-software`,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add token to requests
    this.api.interceptors.request.use(
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
  }

  async scanInstalledSoftware() {
    try {
      const response = await this.api.post('/scan');
      return response.data;
    } catch (error) {
      console.error('Error scanning installed software:', error);
      throw error;
    }
  }

  async getInstalledSoftware() {
    try {
      const response = await this.api.get('/');
      return response.data;
    } catch (error) {
      console.error('Error getting installed software:', error);
      throw error;
    }
  }

  async installSoftware(software) {
    try {
      console.log('Starting software installation:', {
        software,
        token: localStorage.getItem('token'),
        baseURL: this.api.defaults.baseURL
      });
      
      const requestData = {
        appId: software.id,
        name: software.name,
        version: software.version || '1.0.0',
        isCask: Boolean(software.isCask)
      };
      
      console.log('Sending installation request:', {
        url: `${this.api.defaults.baseURL}/`,
        data: requestData,
        headers: this.api.defaults.headers
      });
      
      // Start installation
      const response = await this.api.post('/', requestData);
      
      console.log('Installation response:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });
      
      // Check if the response indicates an error
      if (response.data.error) {
        console.error('Installation error from response:', response.data.error);
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      console.error('Installation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: error.config
      });
      
      // Extract the error message from the response
      const errorMessage = error.response?.data?.message || error.message;
      
      // Create a new error with the extracted message
      const enhancedError = new Error(errorMessage);
      
      // Add the response data for additional context
      enhancedError.response = error.response;
      
      throw enhancedError;
    }
  }

  async checkCommand(command) {
    try {
      console.log('Checking command:', command);
      const response = await this.api.post('/check-command', { command });
      console.log('Command check response:', response.data);
      return {
        exists: response.data.exists,
        version: response.data.version
      };
    } catch (error) {
      console.error('Error checking Homebrew package:', error);
      return {
        exists: false,
        version: '1.0.0'
      };
    }
  }

  async checkForUpdates(software) {
    try {
      const response = await this.api.get(`/${software.appId || software.id}/updates`);
      return response.data;
    } catch (error) {
      console.error('Error checking for updates:', error);
      throw error;
    }
  }

  async updateSoftware(software) {
    try {
      const response = await this.api.put(`/${software.appId || software.id}`, {
        version: software.version
      });
      return response.data;
    } catch (error) {
      console.error('Error updating software:', error);
      throw error;
    }
  }

  async uninstallSoftware(software) {
    try {
      const response = await this.api.delete(`/${software.appId || software.id}`);
      return response.data;
    } catch (error) {
      console.error('Error uninstalling software:', error);
      throw error;
    }
  }
}

export const installationService = new InstallationService();
