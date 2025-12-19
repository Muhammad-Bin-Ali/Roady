import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, MapPin, Navigation, Loader2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { useTracking } from '@/contexts/TrackingContext';
import { useAuth } from '@/contexts/AuthContext';
import { getTrips } from '@/api/trips';
import { useToast } from '@/hooks/use-toast';
import type { Trip } from '@/types/models';

// For demo purposes - in production, get from secrets
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function GlobeScreen() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [isStartingTrip, setIsStartingTrip] = useState(false);

  const { state: trackingState, startTracking, stopTracking } = useTracking();
  const { user } = useAuth();
  const { toast } = useToast();

  // Load trips on mount
  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user]);

  const loadTrips = async () => {
    if (!user) return;
    setIsLoadingTrips(true);
    try {
      const data = await getTrips(user.id);
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [-98.5795, 39.8283], // Center of US
      pitch: 45,
    });

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add atmosphere effect
      map.current?.setFog({
        "color": "rgba(5, 10, 20, 0.8)",
        "high-color": "rgba(30, 60, 120, 0.6)",
        "horizon-blend": 0.3,
        "space-color": "rgba(2, 3, 10, 1)",
        "star-intensity": 0.8
      });
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Spin animation
    let userInteracting = false;
    const spinEnabled = true;
    const secondsPerRevolution = 120;

    function spinGlobe() {
      if (!map.current) return;
      const zoom = map.current.getZoom();
      if (spinEnabled && !userInteracting && zoom < 5) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > 3) {
          distancePerSecond *= (5 - zoom) / 2;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('dragstart', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', () => { spinGlobe(); });

    spinGlobe();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add trip routes to map
  useEffect(() => {
    if (!mapLoaded || !map.current || trips.length === 0) return;

    // Remove existing layers/sources
    trips.forEach((_, index) => {
      const sourceId = `route-${index}`;
      if (map.current?.getLayer(sourceId)) {
        map.current.removeLayer(sourceId);
      }
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });

    // Add routes
    trips.forEach((trip, index) => {
      if (trip.route.length < 2) return;

      const sourceId = `route-${index}`;
      const coordinates = trip.route.map(p => [p.longitude, p.latitude]);

      map.current?.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      map.current?.addLayer({
        id: sourceId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': index === 0 ? '#4fd1c5' : '#f6ad55',
          'line-width': 3,
          'line-opacity': 0.8,
        },
      });
    });
  }, [mapLoaded, trips]);

  const handleStartTrip = useCallback(async () => {
    setIsStartingTrip(true);
    try {
      await startTracking();
      toast({
        title: 'Trip started!',
        description: 'GPS tracking is now active',
      });
    } catch (error) {
      toast({
        title: 'Failed to start trip',
        description: error instanceof Error ? error.message : 'Please check location permissions',
        variant: 'destructive',
      });
    } finally {
      setIsStartingTrip(false);
    }
  }, [startTracking, toast]);

  const handleStopTrip = useCallback(async () => {
    try {
      await stopTracking();
      toast({
        title: 'Trip ended',
        description: 'Your trip has been saved',
      });
      loadTrips();
    } catch (error) {
      toast({
        title: 'Failed to stop trip',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  }, [stopTracking, toast]);

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted transition-colors">
          <MapPin className="w-5 h-5 text-foreground" />
        </button>
        <button className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted transition-colors">
          <Navigation className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Weather/Info Badge */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2">
          <span className="text-sm">☁️</span>
          <span className="text-sm font-medium">16°</span>
        </div>
      </div>

      {/* Recording Indicator */}
      {trackingState.isTracking && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 left-4 z-10 glass rounded-2xl px-4 py-2 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-400">Recording</span>
        </motion.div>
      )}

      {/* Start/Stop Trip Floating Button */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        <AnimatePresence mode="wait">
          {trackingState.isTracking ? (
            <motion.div
              key="stop"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Button
                onClick={handleStopTrip}
                className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30"
              >
                <Square className="w-6 h-6" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="start"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Button
                onClick={handleStartTrip}
                disabled={isStartingTrip}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary animate-pulse-glow shadow-lg"
              >
                {isStartingTrip ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Card when tracking */}
      {trackingState.isTracking && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-40 left-4 right-4 z-10"
        >
          <div className="glass-strong rounded-3xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{trackingState.pointsCollected}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{trackingState.pointsUploaded}</p>
                <p className="text-xs text-muted-foreground">Uploaded</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {trackingState.pointsCollected - trackingState.pointsUploaded}
                </p>
                <p className="text-xs text-muted-foreground">Buffered</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
