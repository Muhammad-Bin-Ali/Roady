import { Geolocation, type Position } from '@capacitor/geolocation';
import type { GPSPoint } from '@/types/models';
import type {
  TrackingConfig,
  TrackingServiceState,
  LocationCallback,
  TripCallback,
  ErrorCallback,
} from '@/types/tracking';
import * as trackingApi from '@/api/tracking';
import { GpsBuffer, RetryScheduler } from './GpsBufferService';

// Default configuration
const defaultConfig: TrackingConfig = {
  minDistanceFilter: 10, // 10 meters
  minTimeInterval: 1000, // 1 second
  enableHighAccuracy: true,
  maxBatchSize: 50, // Matched with GpsBuffer default
  uploadInterval: 30000, // 30 seconds
};

// Service state
let state: TrackingServiceState = {
  isInitialized: false,
  isTracking: false,
  currentTripId: null,
  lastError: null,
  pointsCollected: 0,
  pointsUploaded: 0,
};

// Callbacks
const locationCallbacks: Set<LocationCallback> = new Set();
const tripStartCallbacks: Set<TripCallback> = new Set();
const tripEndCallbacks: Set<TripCallback> = new Set();
const errorCallbacks: Set<ErrorCallback> = new Set();

// GPS Buffer & Scheduler
const buffer = new GpsBuffer();
let scheduler: RetryScheduler | null = null;

let watchId: string | null = null;
let currentUserId: string | null = null;

// Initialize the tracking service
export async function initialize(config?: Partial<TrackingConfig>): Promise<void> {
  const finalConfig = { ...defaultConfig, ...config };

  try {
    // Request permissions
    const permission = await Geolocation.requestPermissions();
    if (permission.location !== 'granted') {
      throw new Error('Location permission denied');
    }

    // Check for crash recovery
    const resumedTripId = await buffer.resumeIfNeeded();
    if (resumedTripId) {
      console.log('Resuming trip from crash:', resumedTripId);
      state.currentTripId = resumedTripId;
      state.isTracking = true;
      // We don't know the user ID here easily without persistence, 
      // but we can assume the auth service will restore the user.
      // For now, we might need to wait for startTracking to be called with userId 
      // or store userId in the buffer metadata.
      // Since we don't have userId here, we can't start the scheduler yet.
    }

    state = {
      ...state,
      isInitialized: true,
      lastError: null,
    };

    console.log('Tracking service initialized', finalConfig);
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : 'Failed to initialize';
    errorCallbacks.forEach(cb => cb(error as Error));
    throw error;
  }
}

// Start tracking
export async function startTracking(userId: string): Promise<void> {
  if (!state.isInitialized) {
    await initialize();
  }

  if (state.isTracking && state.currentTripId) {
    console.warn('Already tracking or resuming');
    // If we are resuming, we just need to set the user and start scheduler
    currentUserId = userId;
    setupScheduler(userId, state.currentTripId);
    startGeolocation();
    return;
  }

  currentUserId = userId;

  try {
    // Start a new trip
    const response = await trackingApi.startTrip(userId, {
      name: `Trip ${new Date().toLocaleDateString()}`,
    });

    state.currentTripId = response.tripId;
    state.isTracking = true;
    state.pointsCollected = 0;
    state.pointsUploaded = 0;

    // Initialize Buffer
    await buffer.startTrip(response.tripId);
    
    // Setup Scheduler
    setupScheduler(userId, response.tripId);

    // Start watching position
    await startGeolocation();

    // Notify callbacks
    tripStartCallbacks.forEach(cb => cb());

    console.log('Tracking started', response);
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : 'Failed to start tracking';
    errorCallbacks.forEach(cb => cb(error as Error));
    throw error;
  }
}

function setupScheduler(userId: string, tripId: string) {
  scheduler = new RetryScheduler(buffer, async (points) => {
    await trackingApi.uploadPoints(userId, tripId, points);
    state.pointsUploaded += points.length;
  });
  scheduler.start();
}

async function startGeolocation() {
  if (watchId) return;
  
  watchId = await Geolocation.watchPosition(
    {
      enableHighAccuracy: defaultConfig.enableHighAccuracy,
      timeout: 10000,
      maximumAge: 0,
    },
    handlePositionUpdate
  );
}

// Stop tracking
export async function stopTracking(userId: string): Promise<void> {
  if (!state.isTracking || !state.currentTripId) {
    console.warn('Not currently tracking');
    return;
  }

  try {
    // Stop watching position
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
      watchId = null;
    }

    // Stop scheduler
    if (scheduler) {
      scheduler.stop();
      scheduler = null;
    }

    // End trip in buffer and get remaining points
    const remainingPoints = await buffer.endTrip();
    
    // Upload remaining points
    if (remainingPoints.length > 0) {
      try {
        await trackingApi.uploadPoints(userId, state.currentTripId, remainingPoints);
        state.pointsUploaded += remainingPoints.length;
      } catch (e) {
        console.error('Failed to upload final points:', e);
        // In a real app, we might want to save these somewhere else or retry
      }
    }

    // Stop the trip API
    const response = await trackingApi.stopTrip(userId, state.currentTripId);

    state.isTracking = false;
    state.currentTripId = null;
    currentUserId = null;

    // Notify callbacks
    tripEndCallbacks.forEach(cb => cb());

    console.log('Tracking stopped', response);
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : 'Failed to stop tracking';
    errorCallbacks.forEach(cb => cb(error as Error));
    throw error;
  }
}

// Handle position updates
function handlePositionUpdate(position: Position | null, err?: unknown): void {
  if (err) {
    console.error('Position error:', err);
    errorCallbacks.forEach(cb => cb(err as Error));
    return;
  }

  if (!position) return;

  const point: GPSPoint = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude ?? undefined,
    accuracy: position.coords.accuracy,
    speed: position.coords.speed ?? undefined,
    heading: position.coords.heading ?? undefined,
    timestamp: new Date(position.timestamp).toISOString(),
  };

  // Add to buffer
  buffer.appendPoint(point).catch(e => console.error('Buffer append failed', e));
  state.pointsCollected++;

  // Notify callbacks
  locationCallbacks.forEach(cb => cb(point));

  // Trigger scheduler
  if (scheduler) {
    scheduler.trigger();
  }
}

// Register callbacks
export function onLocationUpdate(callback: LocationCallback): () => void {
  locationCallbacks.add(callback);
  return () => locationCallbacks.delete(callback);
}

export function onTripStart(callback: TripCallback): () => void {
  tripStartCallbacks.add(callback);
  return () => tripStartCallbacks.delete(callback);
}

export function onTripEnd(callback: TripCallback): () => void {
  tripEndCallbacks.add(callback);
  return () => tripEndCallbacks.delete(callback);
}

export function onError(callback: ErrorCallback): () => void {
  errorCallbacks.add(callback);
  return () => errorCallbacks.delete(callback);
}

// Get current state
export function getState(): TrackingServiceState {
  return { ...state };
}

// Get current position (one-time)
export async function getCurrentPosition(): Promise<GPSPoint> {
  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude ?? undefined,
    accuracy: position.coords.accuracy,
    speed: position.coords.speed ?? undefined,
    heading: position.coords.heading ?? undefined,
    timestamp: new Date(position.timestamp).toISOString(),
  };
}
