import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { AuthTokens, DeviceInfo } from '../types';
import { generateDeviceFingerprint } from '../utils/helpers';
import { logger } from '../utils/logger';

const STORAGE_KEYS = {
  TOKENS: '@hocco_tokens',
  DEVICE_INFO: '@hocco_device_info',
  LOCATION_QUEUE: '@hocco_location_queue',
  APP_STATE: '@hocco_app_state',
};

class StorageService {
  // Token management
  async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      // Store refresh token securely in Keychain
      await Keychain.setGenericPassword('refresh_token', tokens.refresh_token, {
        service: 'hocco_refresh_token',
      });

      // Store access token in AsyncStorage (short-lived)
      await AsyncStorage.setItem(
        STORAGE_KEYS.TOKENS,
        JSON.stringify({
          access_token: tokens.access_token,
          expires_in: tokens.expires_in,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      logger.error('Failed to save tokens:', error);
      throw error;
    }
  }

  async getTokens(): Promise<AuthTokens | null> {
    try {
      // Get access token from AsyncStorage
      const tokensStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKENS);
      if (!tokensStr) return null;

      const tokens = JSON.parse(tokensStr);
      
      // Get refresh token from Keychain
      const credentials = await Keychain.getGenericPassword({
        service: 'hocco_refresh_token',
      });

      if (!credentials || !credentials.password) return null;

      return {
        access_token: tokens.access_token,
        refresh_token: credentials.password,
        expires_in: tokens.expires_in,
      };
    } catch (error) {
      logger.error('Failed to get tokens:', error);
      return null;
    }
  }

  async saveAccessToken(accessToken: string): Promise<void> {
    try {
      const tokensStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKENS);
      let tokens = tokensStr ? JSON.parse(tokensStr) : {};

      tokens.access_token = accessToken;
      tokens.timestamp = Date.now();

      await AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
    } catch (error) {
      logger.error('Failed to save access token:', error);
      throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKENS);
      await Keychain.resetGenericPassword({ service: 'hocco_refresh_token' });
    } catch (error) {
      logger.error('Failed to clear tokens:', error);
    }
  }

  // Device info management
  async saveDeviceInfo(deviceInfo: DeviceInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DEVICE_INFO,
        JSON.stringify(deviceInfo)
      );
    } catch (error) {
      logger.error('Failed to save device info:', error);
      throw error;
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      const deviceInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_INFO);
      return deviceInfoStr ? JSON.parse(deviceInfoStr) : null;
    } catch (error) {
      logger.error('Failed to get device info:', error);
      return null;
    }
  }

  async getOrCreateDeviceInfo(): Promise<DeviceInfo> {
    let deviceInfo = await this.getDeviceInfo();
    
    if (!deviceInfo) {
      deviceInfo = await generateDeviceFingerprint();
      await this.saveDeviceInfo(deviceInfo);
    }

    return deviceInfo;
  }

  // Location queue for offline support
  async addToLocationQueue(locationData: any): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_QUEUE);
      const queue = queueStr ? JSON.parse(queueStr) : [];
      
      queue.push({
        ...locationData,
        timestamp: new Date().toISOString(),
        attempt: 0,
      });

      // Keep only last 100 locations
      if (queue.length > 100) {
        queue.shift();
      }

      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_QUEUE, JSON.stringify(queue));
    } catch (error) {
      logger.error('Failed to add to location queue:', error);
    }
  }

  async getLocationQueue(): Promise<any[]> {
    try {
      const queueStr = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_QUEUE);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      logger.error('Failed to get location queue:', error);
      return [];
    }
  }

  // Add these methods to the StorageService class

async saveLocationQueue(queue: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.LOCATION_QUEUE,
      JSON.stringify(queue)
    );
  } catch (error) {
    logger.error('Failed to save location queue:', error);
    throw error;
  }
}

async updateLocationQueue(updatedQueue: any[]): Promise<void> {
  try {
    await this.saveLocationQueue(updatedQueue);
  } catch (error) {
    logger.error('Failed to update location queue:', error);
    throw error;
  }
}

  async clearLocationQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LOCATION_QUEUE);
    } catch (error) {
      logger.error('Failed to clear location queue:', error);
    }
  }

  async updateLocationQueueItem(index: number, updates: any): Promise<void> {
    try {
      const queue = await this.getLocationQueue();
      if (queue[index]) {
        queue[index] = { ...queue[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_QUEUE, JSON.stringify(queue));
      }
    } catch (error) {
      logger.error('Failed to update location queue:', error);
    }
  }


  // App state management
  async saveAppState(state: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_STATE,
        JSON.stringify(state)
      );
    } catch (error) {
      logger.error('Failed to save app state:', error);
    }
  }

  async getAppState(): Promise<any> {
    try {
      const stateStr = await AsyncStorage.getItem(STORAGE_KEYS.APP_STATE);
      return stateStr ? JSON.parse(stateStr) : null;
    } catch (error) {
      logger.error('Failed to get app state:', error);
      return null;
    }
  }

  // Clear all storage (for logout)
  async clearAll(): Promise<void> {
    try {
      await this.clearTokens();
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.DEVICE_INFO,
        STORAGE_KEYS.LOCATION_QUEUE,
        STORAGE_KEYS.APP_STATE,
      ]);
    } catch (error) {
      logger.error('Failed to clear all storage:', error);
    }
  }
}

export const storage = new StorageService();