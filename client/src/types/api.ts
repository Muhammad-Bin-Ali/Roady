import type { User, Trip, GPSPoint } from './models';

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface SignUpParams {
  email: string;
  username: string;
  password: string;
}

export interface LoginParams {
  emailOrUsername: string;
  password: string;
}

export interface NewTripPayload {
  name: string;
  startTime: string;
  initialPoint?: GPSPoint;
}

export interface StartTripResponse {
  success: boolean;
  tripId: string;
  startTime: string;
}

export interface StopTripResponse {
  success: boolean;
  trip: Trip;
}

export interface HeartbeatStatus {
  isTracking: boolean;
  batteryLevel?: number;
  lastPointTimestamp?: string;
  pointsBuffered: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
