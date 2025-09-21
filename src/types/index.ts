export interface Cart {
  cart_id: string;
  vendor_id: string;
  model: string;
  status: 'active' | 'maintenance' | 'retired';
  created_at: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  speed?: number;
  heading?: number;
  battery_level?: number;
  is_moving: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface DeviceInfo {
  device_id: string;
  app_version: string;
  os_version: string;
  device_model: string;
  is_mock_location: boolean;
  is_rooted: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface BackgroundLocationTask {
  locations: LocationData[];
  attempt: number;
  lastAttempt: number;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Location: undefined;
  Profile: undefined;
  Scanner: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  QRScanner: undefined;
};