// __mocks__/react-native-background-geolocation.ts
const mockFn = jest.fn();

const BackgroundGeolocation = {
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

export default BackgroundGeolocation;
