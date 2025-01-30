import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3007';

class InstallationService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/user-software`,
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
      const response = await this.api.get(`/${software.id}/updates`);
      return response.data;
    } catch (error) {
      console.error('Error checking for updates:', error);
      throw error;
    }
  }

  async updateSoftware(software) {
    try {
      const response = await this.api.put(`/${software.id}`, {
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
      const response = await this.api.delete(`/${software.id}`);
      return response.data;
    } catch (error) {
      console.error('Error uninstalling software:', error);
      throw error;
    }
  }

  // Helper method to check if a command exists on the system
  async checkCommand(command) {
    try {
      const response = await this.api.post('/check-command', { command });
      return response.data.exists;
    } catch (error) {
      console.error('Error checking command:', error);
      return false;
    }
  }
}

export const installationService = new InstallationService();
