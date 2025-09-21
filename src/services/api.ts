import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, ERRORS } from '../config/environment';
import { AuthTokens, ApiResponse } from '../types';
import { storage } from './storage';

export class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const tokens = await storage.getTokens();
        if (tokens?.access_token) {
          config.headers.Authorization = `Bearer ${tokens.access_token}`;
        }
        
        // Add device info to all requests
        const deviceInfo = await storage.getDeviceInfo();
        if (deviceInfo) {
          config.headers['X-Device-Info'] = JSON.stringify(deviceInfo);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          if (!this.isRefreshing) {
            this.isRefreshing = true;
            
            try {
              const tokens = await storage.getTokens();
              if (!tokens?.refresh_token) {
                throw new Error('No refresh token available');
              }

              const response = await this.refreshToken(tokens.refresh_token);
              const newAccessToken = response.data?.access_token;

              if (newAccessToken) {
                await storage.saveAccessToken(newAccessToken);
                this.onRefreshed(newAccessToken);
                return this.client(originalRequest);
              }
            } catch (refreshError) {
              this.onRefreshFailed();
              await storage.clearTokens();
              // Navigate to login screen
              // navigation.navigate('Login');
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          }

          return new Promise((resolve) => {
            this.subscribeTokenRefresh((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(this.client(originalRequest));
            });
          });
        }

        return Promise.reject(error);
      }
    );
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private onRefreshFailed() {
    this.refreshSubscribers.forEach(callback => callback(''));
    this.refreshSubscribers = [];
  }

  async login(assignmentToken: string, deviceFingerprint: string, otp: string): Promise<ApiResponse<AuthTokens>> {
    try {
      const response = await this.client.post('/auth/login', {
        assignment_token: assignmentToken,
        device_fingerprint: deviceFingerprint,
        otp: otp || '123456' // Default for development
      });

      return { data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Login failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ access_token: string; expires_in: number }>> {
    try {
      const response = await this.client.post('/auth/refresh', {
        refresh_token: refreshToken
      });

      return { data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Token refresh failed');
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      await this.client.post('/auth/logout');
      await storage.clearTokens();
      return { data: { message: 'Logged out successfully' } };
    } catch (error: any) {
      return this.handleError(error, 'Logout failed');
    }
  }

  async sendLocation(locationData: any): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/ingest/location', locationData);
      return { data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Location send failed');
    }
  }

  async getCartDetails(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/carts/current');
      return { data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to get cart details');
    }
  }

  private handleError(error: any, defaultMessage: string): ApiResponse {
    if (error.response) {
      // Server responded with error status
      return {
        error: {
          code: error.response.data?.error || ERRORS.NETWORK.SERVER_ERROR,
          message: error.response.data?.message || defaultMessage,
          details: error.response.data?.details
        }
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        error: {
          code: ERRORS.NETWORK.NO_INTERNET,
          message: 'No internet connection',
          details: error.message
        }
      };
    } else {
      // Something else happened
      return {
        error: {
          code: 'UNKNOWN_ERROR',
          message: defaultMessage,
          details: error.message
        }
      };
    }
  }
}

export const apiService = new ApiService();