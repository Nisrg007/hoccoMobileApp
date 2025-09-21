// __tests__/AuthProvider.test.tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { storage } from '../src/services/storage';
import { apiService } from '../src/services/api';

jest.mock('../src/services/storage');
jest.mock('../src/services/api');

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully', async () => {
    const mockTokens = { access_token: 'token', refresh_token: 'refresh' };
    const mockCart = { id: 'cart1' };

    (storage.getOrCreateDeviceInfo as jest.Mock).mockResolvedValue({ device_id: '123' });
    (apiService.login as jest.Mock).mockResolvedValue({ data: mockTokens });
    (apiService.getCartDetails as jest.Mock).mockResolvedValue({ data: { cart: mockCart } });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login('assignmentToken', '123456');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.tokens).toEqual(mockTokens);
    expect(result.current.user.cart).toEqual(mockCart);

    expect(storage.saveTokens).toHaveBeenCalledWith(mockTokens);
  });

  it('should handle login failure', async () => {
    (storage.getOrCreateDeviceInfo as jest.Mock).mockResolvedValue({ device_id: '123' });
    (apiService.login as jest.Mock).mockResolvedValue({ error: { message: 'Login failed' } });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login('assignmentToken', '123456');
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Login failed');
    expect(storage.clearTokens).toHaveBeenCalled();
  });

  it('should logout correctly', async () => {
    (apiService.logout as jest.Mock).mockResolvedValue({});
    (storage.clearAll as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user.tokens).toBeNull();
    expect(storage.clearAll).toHaveBeenCalled();
  });
});
