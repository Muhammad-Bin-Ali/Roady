export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  avatar?: string;
}

export interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  startTime: string;
  endTime?: string;
  distance: number; // in meters
  duration: number; // in seconds
  maxSpeed?: number;
  avgSpeed?: number;
  route: GPSPoint[];
  status: 'active' | 'completed' | 'paused';
  thumbnail?: string;
}

export interface TripSummary {
  id: string;
  name: string;
  date: string;
  distance: number;
  duration: number;
  routePreview: [number, number][]; // [lng, lat] pairs
}

export interface TrackingState {
  isTracking: boolean;
  currentTrip?: Trip;
  lastPoint?: GPSPoint;
  pointsBuffer: GPSPoint[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}
