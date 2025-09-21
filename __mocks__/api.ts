// __mocks__/api.ts
export const apiService = {
  login: jest.fn(),
  logout: jest.fn(),
  getCartDetails: jest.fn(),
  refreshToken: jest.fn(),
  sendLocation: jest.fn(),
};
