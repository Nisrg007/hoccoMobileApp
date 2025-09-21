import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthTokens, Cart, DeviceInfo } from '../types';
import { apiService } from '../services/api';
import { storage } from '../services/storage';
import { logger } from '../utils/logger';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    cart: Cart | null;
    tokens: AuthTokens | null;
    deviceInfo: DeviceInfo | null;
  };
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { tokens: AuthTokens; cart: Cart } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_CART'; payload: Cart };

interface AuthContextType extends AuthState {
  login: (assignmentToken: string, otp?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: {
    cart: null,
    tokens: null,
    deviceInfo: null,
  },
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: {
          ...state.user,
          tokens: action.payload.tokens,
          cart: action.payload.cart,
        },
        error: null,
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'UPDATE_CART':
      return {
        ...state,
        user: {
          ...state.user,
          cart: action.payload,
        },
      };
    
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const tokens = await storage.getTokens();
      const deviceInfo = await storage.getDeviceInfo();

      if (!tokens || !deviceInfo) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Verify tokens are still valid
      const cartResponse = await apiService.getCartDetails();
      
      if (cartResponse.error) {
        if (cartResponse.error.code === 'invalid_token' || cartResponse.error.code === 'token_expired') {
          await storage.clearTokens();
        }
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          tokens,
          cart: cartResponse.data.cart,
        },
      });

    } catch (error) {
      logger.error('Auth check failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (assignmentToken: string, otp?: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const deviceInfo = await storage.getOrCreateDeviceInfo();

      const response = await apiService.login(
        assignmentToken,
        deviceInfo.device_id,
        otp || '123456'
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('No response data received');
      }

      // Save tokens and device info
      await storage.saveTokens(response.data);
      await storage.saveDeviceInfo(deviceInfo);

      // Get cart details
      const cartResponse = await apiService.getCartDetails();
      
      if (cartResponse.error) {
        throw new Error(cartResponse.error.message);
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          tokens: response.data,
          cart: cartResponse.data.cart,
        },
      });

    } catch (error: any) {
      logger.error('Login failed:', error);
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.message || 'Login failed. Please try again.' 
      });
      
      // Clean up on failure
      await storage.clearTokens();
    }
  };

  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call logout API
      await apiService.logout();
      
      // Clear local storage
      await storage.clearAll();
      
      dispatch({ type: 'LOGOUT' });

    } catch (error) {
      logger.error('Logout failed:', error);
      // Still clear local state even if API call fails
      await storage.clearAll();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const tokens = await storage.getTokens();
      
      if (!tokens?.refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.refreshToken(tokens.refresh_token);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('No response data received');
      }

      // Update stored tokens
      await storage.saveAccessToken(response.data.access_token);

      // Update context state
      const newTokens = {
        ...tokens,
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
      };

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          tokens: newTokens,
          cart: state.user.cart!,
        },
      });

    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      await logout();
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};