import axios from 'axios';
import config from '../config';

class UpdateService {
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

  async checkForUpdates(software) {
    try {
      console.log('Checking for updates:', software);
      const response = await this.api.get(`/${software.appId || software.id}/updates`);
      console.log('Update check response:', response.data);
      return {
        hasUpdate: response.data.hasUpdate,
        currentVersion: response.data.currentVersion,
        latestVersion: response.data.latestVersion
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      throw error;
    }
  }

  async updateSoftware(software) {
    try {
      console.log('Updating software:', software);
      const response = await this.api.put(`/${software.appId || software.id}`, {
        version: software.version
      });
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating software:', error);
      throw error;
    }
  }
}

export const updateService = new UpdateService();
