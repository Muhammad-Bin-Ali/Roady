import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { GPSPoint, TripMetadata } from '@/types/models';
import type { TrackingServiceState } from '@/types/tracking';
import * as trackingService from '@/services/trackingService';
import { useAuth } from './AuthContext';

interface TrackingContextType {
  state: TrackingServiceState;
  lastLocation: GPSPoint | null;
  startTracking: (metadata?: TripMetadata) => Promise<void>;
  stopTracking: () => Promise<void>;
  getCurrentLocation: () => Promise<GPSPoint>;
}

const TrackingContext = createContext<TrackingContextType | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<TrackingServiceState>(trackingService.getState());
  const [lastLocation, setLastLocation] = useState<GPSPoint | null>(null);

  useEffect(() => {
    // Subscribe to location updates
    const unsubLocation = trackingService.onLocationUpdate((point) => {
      setLastLocation(point);
    });

    const unsubTripStart = trackingService.onTripStart(() => {
      setState(trackingService.getState());
    });

    const unsubTripEnd = trackingService.onTripEnd(() => {
      setState(trackingService.getState());
    });

    return () => {
      unsubLocation();
      unsubTripStart();
      unsubTripEnd();
    };
  }, []);

  const startTracking = useCallback(async (metadata?: TripMetadata) => {
    if (!user) throw new Error('Must be authenticated to track');
    await trackingService.startTracking(user.id);
    setState(trackingService.getState());
  }, [user]);

  const stopTracking = useCallback(async () => {
    if (!user) throw new Error('Must be authenticated to stop tracking');
    await trackingService.stopTracking(user.id);
    setState(trackingService.getState());
  }, [user]);

  const getCurrentLocation = useCallback(async () => {
    const position = await trackingService.getCurrentPosition();
    setLastLocation(position);
    return position;
  }, []);

  return (
    <TrackingContext.Provider
      value={{
        state,
        lastLocation,
        startTracking,
        stopTracking,
        getCurrentLocation,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextType {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}
