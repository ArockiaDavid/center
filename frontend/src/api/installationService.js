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
      const response = await this.api.post('/', {
        appId: software.id,
        name: software.name,
        version: software.version || '1.0.0'
      });
      return response.data;
    } catch (error) {
      console.error('Error installing software:', error);
      throw error;
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

  // Helper method to check if a package exists in Homebrew
  async checkCommand(command) {
    try {
      const response = await this.api.post('/check-command', { command });
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
}

export const installationService = new InstallationService();
