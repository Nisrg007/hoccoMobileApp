// __mocks__/react-native-device-info.ts
export default {
  getUniqueId: jest.fn(() => 'unique-id'),
  getDeviceId: jest.fn(() => 'device-id'),
  getBrand: jest.fn(() => 'brand'),
  getModel: jest.fn(() => 'model'),
  getSystemVersion: jest.fn(() => 'os-version'),
  getVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '1'),
  isJailBroken: jest.fn(() => false),
  isEmulator: jest.fn(() => false),
  isPinOrFingerprintSet: jest.fn(() => true),
};
