// Environment variables configuration
const config = {
  // Application information
  appName: process.env.APP_NAME || 'Software Center',
  companyName: process.env.COMPANY_NAME || 'Your Company',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@softwarecenter.com',

  // API Configuration
  apiUrl: process.env.API_URL || 'http://localhost:3007',
  apiVersion: process.env.API_VERSION || '/api/v1',

  // Feature flags
  enableAuth: process.env.ENABLE_AUTH === 'true',
  enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',

  // UI Configuration
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10),
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000', 10),
  theme: {
    primaryColor: process.env.THEME_PRIMARY_COLOR || '#007bff',
    secondaryColor: process.env.THEME_SECONDARY_COLOR || '#6c757d',
  },

  // Meta Information
  meta: {
    title: process.env.META_TITLE || 'Software Center - Manage Your Software',
    description: process.env.META_DESCRIPTION || 'Centralized software management platform',
    keywords: process.env.META_KEYWORDS || 'software,management,installation,tracking',
  },

  // Helper methods
  getApiEndpoint: (path) => {
    const baseUrl = config.apiUrl + config.apiVersion;
    return `${baseUrl}${path}`;
  },

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

export default config;
