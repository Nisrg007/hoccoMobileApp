import BackgroundGeolocation, {
  Location,
  Subscription,
  Config,
  State,
  MotionChangeEvent,
  HttpEvent,
  ProviderChangeEvent,
  ConnectivityChangeEvent,
  AuthorizationEvent,
  AuthorizationStatus,
} from 'react-native-background-geolocation';
import { API_BASE_URL, APP_CONFIG } from '../config/environment';
import { apiService } from './api';
import { storage } from './storage';
import { logger } from '../utils/logger';
import { LocationData, DeviceInfo } from '../types';

class LocationService {
  private locationSubscription: Subscription | null = null;
  private motionChangeSubscription: Subscription | null = null;
  private httpSubscription: Subscription | null = null;
  private providerChangeSubscription: Subscription | null = null;
  private activityChangeSubscription: Subscription | null = null;
  private connectivityChangeSubscription: Subscription | null = null;
  private isTracking = false;

  async configure(): Promise<void> {
    try {
      const deviceInfo = await storage.getOrCreateDeviceInfo();

      const config: Config = {
        // General
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 10,
        stopTimeout: 5,
        stopOnTerminate: false,
        startOnBoot: true,
        foregroundService: true,
        
        // HTTP & Persistence
        url: `${API_BASE_URL}/ingest/location`,
        autoSync: true,
        autoSyncThreshold: 0,
        batchSync: false, // Changed to false since we handle manually
        maxDaysToPersist: 3,
        
        // Headers
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': deviceInfo.device_id,
          'Authorization': 'Bearer ' + (await storage.getTokens())?.access_token,
        },
        
        // Location Parameters
        locationUpdateInterval: APP_CONFIG.LOCATION_INTERVALS.MOVING,
        fastestLocationUpdateInterval: 5000,
        deferTime: 30000,
        
        // Activity Recognition
        activityRecognitionInterval: 10000,
        stopDetectionDelay: 300000,
        
        // Application
        debug: __DEV__,
        logLevel: __DEV__ ? BackgroundGeolocation.LOG_LEVEL_VERBOSE : BackgroundGeolocation.LOG_LEVEL_OFF,
        
        // Battery
        disableElasticity: false,
        elasticityMultiplier: 1,
        disableMotionActivityUpdates: false,
        
        // Geolocation
        pausesLocationUpdatesAutomatically: false,
        disableLocationAuthorizationAlert: true,
      };

      // Remove the auto-sync URL since we handle it manually
      delete config.url;
      delete config.autoSync;
      delete config.autoSyncThreshold;

      await BackgroundGeolocation.ready(config);

      // Configure event listeners
      this.configureEventListeners();

      logger.info('BackgroundGeolocation configured successfully');

    } catch (error) {
      logger.error('Failed to configure BackgroundGeolocation:', error);
      throw error;
    }
  }

  private configureEventListeners(): void {
    // Location event
    this.locationSubscription = BackgroundGeolocation.onLocation(
      this.onLocation.bind(this)
    );

    // Motion change event
    this.motionChangeSubscription = BackgroundGeolocation.onMotionChange(
      this.onMotionChange.bind(this)
    );

    // HTTP event (for manual sync)
    this.httpSubscription = BackgroundGeolocation.onHttp(this.onHttpEvent.bind(this));

    // Provider change event
    this.providerChangeSubscription = BackgroundGeolocation.onProviderChange(
      this.onProviderChange.bind(this)
    );

    // Activity change event
    this.activityChangeSubscription = BackgroundGeolocation.onActivityChange(
      this.onActivityChange.bind(this)
    );

    // Connectivity change event
    this.connectivityChangeSubscription = BackgroundGeolocation.onConnectivityChange(
      this.onConnectivityChange.bind(this)
    );

    // Authorization event
    BackgroundGeolocation.onAuthorization(this.onAuthorization.bind(this));
  }

  private async onLocation(location: Location): Promise<void> {
    try {
      if (location.sample) return; // Ignore sample locations

      const deviceInfo = await storage.getDeviceInfo();
      const batteryLevel = await this.getBatteryLevel();

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date(location.timestamp).toISOString(),
        accuracy: location.coords.accuracy,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
        battery_level: batteryLevel,
        is_moving: location.is_moving,
      };

      // Add to offline queue first
      await storage.addToLocationQueue({
        ...locationData,
        device_info: deviceInfo,
      });

      // Try to send immediately if online
      await this.trySendLocation({ ...locationData, device_info: deviceInfo });

      logger.debug('Location received', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        is_moving: location.is_moving,
      });

    } catch (error) {
      logger.error('Error processing location:', error);
    }
  }

  private async trySendLocation(locationData: any): Promise<void> {
    try {
      const result = await apiService.sendLocation(locationData);
      
      if (!result.error && locationData.timestamp) {
        // Remove from queue if successfully sent
        const queue = await storage.getLocationQueue();
        const updatedQueue = queue.filter(item => item.timestamp !== locationData.timestamp);
        await storage.updateLocationQueue(updatedQueue);
      }
    } catch (error) {
      logger.debug('Location send failed, keeping in queue:', error);
    }
  }

  private onMotionChange(event: MotionChangeEvent): void {
    logger.debug('Motion changed', {
      is_moving: event.isMoving,
    });

    // Adjust location update interval based on motion
    this.adjustUpdateInterval(event.isMoving);
  }

  private onHttpEvent(event: HttpEvent): void {
    if (event.status >= 400) {
      logger.error('HTTP error from server:', event);
    } else {
      logger.debug('Location successfully synced via HTTP');
    }
  }

  private onProviderChange(event: ProviderChangeEvent): void {
    logger.info('Location provider changed', {
      enabled: event.enabled,
      status: event.status,
      gps: event.gps,
    });
  }

  private onActivityChange(event: any): void {
    logger.debug('Activity changed', {
      activity: event.activity,
      confidence: event.confidence,
    });
  }

  private onConnectivityChange(event: ConnectivityChangeEvent): void {
    logger.info('Connectivity changed', {
      connected: event.connected,
    });

    if (event.connected) {
      this.processOfflineQueue();
    }
  }

  private onAuthorization(event: AuthorizationEvent): void {
    logger.info('Authorization status changed', {
      status: event.status,
    });
  }

  private async adjustUpdateInterval(isMoving: boolean): Promise<void> {
    try {
      const interval = isMoving 
        ? APP_CONFIG.LOCATION_INTERVALS.MOVING
        : APP_CONFIG.LOCATION_INTERVALS.IDLE;

      await BackgroundGeolocation.setConfig({
        locationUpdateInterval: interval,
      });

      logger.debug('Update interval adjusted', {
        isMoving,
        interval,
      });

    } catch (error) {
      logger.error('Failed to adjust update interval:', error);
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      // Use react-native-device-info or other battery API
      // For now, return -1 (unknown)
      return -1;
    } catch (error) {
      return -1;
    }
  }

  async startTracking(): Promise<void> {
    try {
      if (this.isTracking) return;

      await this.configure();
      await BackgroundGeolocation.start();
      
      this.isTracking = true;
      logger.info('Location tracking started');

    } catch (error) {
      logger.error('Failed to start location tracking:', error);
      throw error;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (!this.isTracking) return;

      await BackgroundGeolocation.stop();
      this.isTracking = false;
      
      logger.info('Location tracking stopped');

    } catch (error) {
      logger.error('Failed to stop location tracking:', error);
      throw error;
    }
  }

  async getCurrentState(): Promise<State> {
    return await BackgroundGeolocation.getState();
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Use the correct permission request method
      const status = await BackgroundGeolocation.requestPermission();
      
      return status === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS;

    } catch (error) {
      logger.error('Failed to request location permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const status = await BackgroundGeolocation.requestPermission();
      return status === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS;
    } catch (error) {
      logger.error('Failed to check permissions:', error);
      return false;
    }
  }

  async processOfflineQueue(): Promise<void> {
    try {
      const queue = await storage.getLocationQueue();
      
      for (let i = 0; i < queue.length; i++) {
        const location = queue[i];
        
        try {
          await this.trySendLocation(location);
          
        } catch (error) {
          logger.error('Failed to process offline location:', error);
          
          // Update attempt count
          const updatedQueue = [...queue];
          updatedQueue[i] = {
            ...updatedQueue[i],
            attempt: (updatedQueue[i].attempt || 0) + 1,
            lastAttempt: Date.now(),
          };
          
          await storage.updateLocationQueue(updatedQueue);
        }
      }

    } catch (error) {
      logger.error('Failed to process offline queue:', error);
    }
  }

  async destroy(): Promise<void> {
    try {
      // Remove all subscriptions
      if (this.locationSubscription) this.locationSubscription.remove();
      if (this.motionChangeSubscription) this.motionChangeSubscription.remove();
      if (this.httpSubscription) this.httpSubscription.remove();
      if (this.providerChangeSubscription) this.providerChangeSubscription.remove();
      if (this.activityChangeSubscription) this.activityChangeSubscription.remove();
      if (this.connectivityChangeSubscription) this.connectivityChangeSubscription.remove();
      
      await this.stopTracking();
      logger.info('Location service destroyed');

    } catch (error) {
      logger.error('Failed to destroy location service:', error);
    }
  }

 // Additional utility methods
async getLocations(): Promise<Location[]> {
  const locations = await BackgroundGeolocation.getLocations();
  return locations as Location[];
}

async sync(): Promise<void> {
  await BackgroundGeolocation.sync();
}

async changePace(pace: boolean): Promise<void> {
  await BackgroundGeolocation.changePace(pace);
}

async setConfig(config: Partial<Config>): Promise<void> {
  await BackgroundGeolocation.setConfig(config);
}
}

export const locationService = new LocationService();