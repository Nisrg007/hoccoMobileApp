import { Platform, DeviceEventEmitter } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { DeviceInfo as AppDeviceInfo } from '../types';
import { logger } from './logger';

export const checkRootOrJailbreak = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return (DeviceInfo as any).isRooted?.() ?? false;
  } else {
    return (DeviceInfo as any).isJailBroken?.() ?? false;
  }
};


export const generateDeviceFingerprint = async (): Promise<AppDeviceInfo> => {
  try {
    const uniqueId = await DeviceInfo.getUniqueId();
    const isRooted = await checkRootOrJailbreak();
    const deviceId = await DeviceInfo.getDeviceId();
    const brand = DeviceInfo.getBrand();
    const model = DeviceInfo.getModel();
    const osVersion = DeviceInfo.getSystemVersion();
    const appVersion = DeviceInfo.getVersion();
    const buildNumber = DeviceInfo.getBuildNumber();

    return {
      device_id: uniqueId,
      app_version: `${appVersion} (${buildNumber})`,
      os_version: `${Platform.OS} ${osVersion}`,
      device_model: `${brand} ${model}`,
      is_mock_location: false,
      is_rooted: isRooted
    };
  } catch (error) {
    logger.error('Failed to generate device fingerprint:', error);
    
    // Fallback to basic device info
    return {
      device_id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      app_version: '1.0.0',
      os_version: Platform.OS,
      device_model: 'Unknown Device',
      is_mock_location: false,
      is_rooted: false,
    };
  }
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      logger.warn(`Retry attempt ${attempt} failed, retrying in ${delayMs}ms`);
      await delay(delayMs * attempt); // Exponential backoff
    }
  }
  
  throw lastError!;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

export const formatSpeed = (kmh: number): string => {
  return `${Math.round(kmh)} km/h`;
};

export const formatBatteryLevel = (level: number): string => {
  return `${Math.round(level)}%`;
};

export const isIOS = (): boolean => {
  return Platform.OS === 'ios';
};

export const isAndroid = (): boolean => {
  return Platform.OS === 'android';
};

export const emitEvent = (eventName: string, data?: any): void => {
  DeviceEventEmitter.emit(eventName, data);
};

export const listenToEvent = (eventName: string, callback: (data: any) => void): () => void => {
  const subscription = DeviceEventEmitter.addListener(eventName, callback);
  return () => subscription.remove();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const generateId = (length: number = 12): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};