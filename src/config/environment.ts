import Config from 'react-native-config';

export const API_BASE_URL = Config.API_BASE_URL || 'http://localhost:3001/api/v1';
export const WS_BASE_URL = Config.WS_BASE_URL || 'ws://localhost:3001';

export const APP_CONFIG = {
  // Location tracking intervals
  LOCATION_INTERVALS: {
    MOVING: 10 * 60 * 1000,    // 10 minutes when moving
    IDLE: 60 * 60 * 1000,      // 60 minutes when idle
    OFF_HOURS: 0,              // No updates during off hours (10PM-6AM)
  },
  
  // Maximum accuracy threshold
  MAX_ACCURACY: 100,           // meters
  
  // Battery optimization
  BATTERY_SAVING: {
    ENABLED: true,
    LOW_BATTERY_THRESHOLD: 20, // %
  },
  
  // Offline capabilities
  OFFLINE: {
    MAX_QUEUE_SIZE: 100,
    RETRY_INTERVAL: 30000,     // 30 seconds
  },
};

export const ERRORS = {
  NETWORK: {
    NO_INTERNET: 'NO_INTERNET',
    TIMEOUT: 'TIMEOUT',
    SERVER_ERROR: 'SERVER_ERROR',
  },
  LOCATION: {
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    UNAVAILABLE: 'UNAVAILABLE',
    TIMEOUT: 'TIMEOUT',
  },
  AUTH: {
    INVALID_TOKEN: 'INVALID_TOKEN',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    DEVICE_MISMATCH: 'DEVICE_MISMATCH',
  },
};