import type { GPSPoint } from './models';

export interface TrackingConfig {
  minDistanceFilter: number; // meters
  minTimeInterval: number; // milliseconds
  enableHighAccuracy: boolean;
  maxBatchSize: number;
  uploadInterval: number; // milliseconds
}

export interface LocationUpdateEvent {
  point: GPSPoint;
  accuracy: number;
  isMoving: boolean;
}

export interface TrackingServiceState {
  isInitialized: boolean;
  isTracking: boolean;
  currentTripId: string | null;
  lastError: string | null;
  pointsCollected: number;
  pointsUploaded: number;
}

export interface MotionEvent {
  type: 'start' | 'stop' | 'moving' | 'stationary';
  confidence: number;
  timestamp: string;
}

export type LocationCallback = (point: GPSPoint) => void;
export type TripCallback = () => void;
export type ErrorCallback = (error: Error) => void;
