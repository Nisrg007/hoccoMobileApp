// __tests__/LocationService.test.tsx
import { locationService } from '../src/services/location';
import { storage } from '../src/services/storage';
import BackgroundGeolocation, {
  Location,
  Config,
} from 'react-native-background-geolocation';
import { apiService } from '../src/services/api';

jest.mock('../src/services/storage', () => {
  return {
    storage: {
      getTokens: jest.fn(),
      getOrCreateDeviceInfo: jest.fn(),
      getDeviceInfo: jest.fn(),
      addToLocationQueue: jest.fn(),
      getLocationQueue: jest.fn(),
      updateLocationQueue: jest.fn(),
      clearTokens: jest.fn(),
    },
  };
});

jest.mock('react-native-background-geolocation', () => {
  const mockFn = jest.fn();
  return {
    DESIRED_ACCURACY_HIGH: 3,
    LOG_LEVEL_VERBOSE: 5,
    LOG_LEVEL_OFF: 0,
    AUTHORIZATION_STATUS_ALWAYS: 'always',
    ready: mockFn,
    start: mockFn,
    stop: mockFn,
    setConfig: mockFn,
    getState: mockFn,
    requestPermission: mockFn,
    getLocations: mockFn,
    sync: mockFn,
    changePace: mockFn,
    onLocation: jest.fn(() => ({ remove: mockFn })),
    onMotionChange: jest.fn(() => ({ remove: mockFn })),
    onHttp: jest.fn(() => ({ remove: mockFn })),
    onProviderChange: jest.fn(() => ({ remove: mockFn })),
    onActivityChange: jest.fn(() => ({ remove: mockFn })),
    onConnectivityChange: jest.fn(() => ({ remove: mockFn })),
    onAuthorization: jest.fn(),
  };
});

jest.mock('../src/services/api', () => ({
  apiService: {
    sendLocation: jest.fn(),
  },
}));

const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedApi = apiService as jest.Mocked<typeof apiService>;
const mockedBG = BackgroundGeolocation as jest.Mocked<typeof BackgroundGeolocation>;

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start and stop tracking', async () => {
    mockedStorage.getOrCreateDeviceInfo.mockResolvedValue({ device_id: '123' } as any);
    mockedStorage.getTokens.mockResolvedValue({ access_token: 'token' } as any);

    await locationService.startTracking();
    expect(mockedBG.ready).toHaveBeenCalled();
    expect(mockedBG.start).toHaveBeenCalled();

    await locationService.stopTracking();
    expect(mockedBG.stop).toHaveBeenCalled();
  });

  it('should process offline queue and try sending locations', async () => {
    const mockLocation = {
      timestamp: '123',
      coords: { latitude: 0, longitude: 0, accuracy: 1, speed: 0, heading: 0 },
      is_moving: true,
    } as Location;

    mockedStorage.getLocationQueue.mockResolvedValue([mockLocation]);
    mockedApi.sendLocation.mockResolvedValue({ data: {} } as any);
    mockedStorage.updateLocationQueue.mockResolvedValue(undefined);

    const trySendSpy = jest.spyOn(locationService as any, 'trySendLocation');

    await locationService.processOfflineQueue();

    expect(trySendSpy).toHaveBeenCalledWith(expect.objectContaining(mockLocation));
    expect(mockedStorage.getLocationQueue).toHaveBeenCalled();
  });

  it('should handle onLocation event and add to queue', async () => {
const mockLocation = {
  timestamp: Date.now(),
  coords: { latitude: 1, longitude: 2, accuracy: 5, speed: 0, heading: 0 },
  is_moving: true,
  sample: false,
  age: 0,
  odometer: 0,
  uuid: 'test-uuid',
  battery: { level: 1, is_charging: false },
  activityts: 0,
  activity: 'unknown',
  mock: true, // extra property just for safety
} as unknown as Location;


    mockedStorage.getDeviceInfo.mockResolvedValue({ device_id: '123' } as any);
    mockedStorage.addToLocationQueue.mockResolvedValue(undefined);
    mockedApi.sendLocation.mockResolvedValue({ data: {} } as any);
    mockedStorage.getLocationQueue.mockResolvedValue([]);

    await (locationService as any).onLocation(mockLocation);

    expect(mockedStorage.addToLocationQueue).toHaveBeenCalled();
    expect(mockedApi.sendLocation).toHaveBeenCalled();
  });

  it('should remove location from queue if send succeeds', async () => {
    const mockLocation = {
      timestamp: 'abc',
      coords: { latitude: 0, longitude: 0, accuracy: 1, speed: 0, heading: 0 },
      is_moving: true,
    } as Location;

    mockedStorage.getLocationQueue.mockResolvedValue([mockLocation]);
    mockedApi.sendLocation.mockResolvedValue({ data: {} } as any);
    mockedStorage.updateLocationQueue.mockResolvedValue(undefined);

    await (locationService as any).trySendLocation(mockLocation);

    expect(mockedApi.sendLocation).toHaveBeenCalledWith(expect.objectContaining(mockLocation));
    expect(mockedStorage.updateLocationQueue).toHaveBeenCalledWith([]);
  });
});
