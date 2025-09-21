export const APP_CONSTANTS = {
  // API Configuration
  API_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,

  // Location Configuration
  LOCATION: {
    UPDATE_INTERVAL_MOVING: 10 * 60 * 1000, // 10 minutes
    UPDATE_INTERVAL_IDLE: 60 * 60 * 1000,   // 60 minutes
    MAX_ACCURACY: 100,                      // meters
    DISTANCE_FILTER: 10,                    // meters
  },

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKENS: '@hocco_auth_tokens',
    DEVICE_INFO: '@hocco_device_info',
    LOCATION_QUEUE: '@hocco_location_queue',
    APP_SETTINGS: '@hocco_app_settings',
  },

  // Error Messages
  ERROR_MESSAGES: {
    NETWORK: {
      NO_INTERNET: 'No internet connection',
      TIMEOUT: 'Request timeout',
      SERVER_ERROR: 'Server error occurred',
    },
    LOCATION: {
      PERMISSION_DENIED: 'Location permission denied',
      UNAVAILABLE: 'Location services unavailable',
      TIMEOUT: 'Location request timeout',
    },
    AUTH: {
      INVALID_TOKEN: 'Invalid authentication token',
      SESSION_EXPIRED: 'Session expired',
      DEVICE_MISMATCH: 'Device mismatch detected',
    },
  },

  // App Constants
  APP: {
    NAME: 'Hocco Cart Tracker',
    VERSION: '1.0.0',
    BUILD: '1001',
  },
};

export const COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#6c757d',
  SUCCESS: '#28a745',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#17a2b8',
  LIGHT: '#f8f9fa',
  DARK: '#343a40',
  WHITE: '#ffffff',
  BLACK: '#000000',
};

export const ICONS = {
  COMMON: {
    HOME: 'home',
    LOCATION: 'location',
    PROFILE: 'person',
    SETTINGS: 'settings',
    LOGOUT: 'log-out',
    BACK: 'arrow-back',
    CLOSE: 'close',
    MENU: 'menu',
  },
  ACTIONS: {
    PLAY: 'play',
    STOP: 'stop',
    PAUSE: 'pause',
    REFRESH: 'refresh',
    SAVE: 'save',
    DELETE: 'trash',
    EDIT: 'create',
  },
  STATUS: {
    SUCCESS: 'checkmark-circle',
    ERROR: 'close-circle',
    WARNING: 'warning',
    INFO: 'information-circle',
  },
};