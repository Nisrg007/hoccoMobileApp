// jest.setup.js
// Minimal setup for unit tests without React Native mocks
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-keychain');
jest.mock('react-native-device-info');
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(null)),
  resetGenericPassword: jest.fn(() => Promise.resolve()),
}));
jest.mock('../src/services/storage', () => ({
  storage: {
    getTokens: jest.fn().mockResolvedValue({ access_token: 'token' }),
    getOrCreateDeviceInfo: jest.fn().mockResolvedValue({ device_id: 'device123' }),
    getDeviceInfo: jest.fn().mockResolvedValue({ device_id: 'device123' }),
    addToLocationQueue: jest.fn().mockResolvedValue(undefined),
    getLocationQueue: jest.fn().mockResolvedValue([]),
    updateLocationQueue: jest.fn().mockResolvedValue(undefined),
  },
}));


