// Load and validate environment variables
const getEnvVar = (key, defaultValue = undefined, required = false) => {
  const value = process.env[key] || defaultValue;
  if (required && !value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
};

// Environment variables configuration
const config = {
  // Environment detection
  env: getEnvVar('NODE_ENV', 'development'),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Application information
  appName: getEnvVar('REACT_APP_NAME', 'Software Center'),
  companyName: getEnvVar('REACT_APP_COMPANY_NAME', 'Your Company'),
  supportEmail: getEnvVar('REACT_APP_SUPPORT_EMAIL', 'support@softwarecenter.com'),

  // API Configuration
  apiUrl: getEnvVar(
    process.env.NODE_ENV === 'production' ? 'REACT_APP_API_URL_PROD' : 'REACT_APP_API_URL_DEV',
    'http://localhost:3007',
    true
  ),
  frontendUrl: getEnvVar(
    process.env.NODE_ENV === 'production' ? 'FRONTEND_URL_PROD' : 'FRONTEND_URL_DEV',
    'http://localhost:3000'
  ),

  // Feature flags
  enableAuth: process.env.REACT_APP_ENABLE_AUTH === 'true',
  enableNotifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',

  // UI Configuration
  maxUploadSize: parseInt(process.env.REACT_APP_MAX_UPLOAD_SIZE || '10485760', 10),
  sessionTimeout: parseInt(process.env.REACT_APP_SESSION_TIMEOUT || '3600000', 10),
  theme: {
    primaryColor: process.env.REACT_APP_THEME_PRIMARY_COLOR || '#007bff',
    secondaryColor: process.env.REACT_APP_THEME_SECONDARY_COLOR || '#6c757d',
  },

  // Meta Information
  meta: {
    title: process.env.REACT_APP_META_TITLE || 'Software Center - Manage Your Software',
    description: process.env.REACT_APP_META_DESCRIPTION || 'Centralized software management platform',
    keywords: process.env.REACT_APP_META_KEYWORDS || 'software,management,installation,tracking',
  },

  // Helper methods
  getApiEndpoint: (path) => {
    return `${config.apiUrl}${path}`;
  },

};

export default config;
