// __mocks__/storage.ts
export const storage = {
  getTokens: jest.fn(),
  saveTokens: jest.fn(),
  clearTokens: jest.fn(),
  getDeviceInfo: jest.fn(),
  saveDeviceInfo: jest.fn(),
  getOrCreateDeviceInfo: jest.fn(),
  clearAll: jest.fn(),
};
