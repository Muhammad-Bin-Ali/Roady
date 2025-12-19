import type { GPSPoint, Trip, TripMetadata, Vehicle } from '@/types/models';
import type { StartTripResponse, StopTripResponse, HeartbeatStatus } from '@/types/api';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Active trips store
const activeTrips: Map<string, Trip> = new Map();
const tripPoints: Map<string, GPSPoint[]> = new Map();

export async function startTrip(
  userId: string,
  metadata?: {
    name?: string;
    source?: string;
    destination?: string;
    vehicle?: Vehicle;
    [key: string]: unknown;
  }
): Promise<StartTripResponse> {
  await delay(300);

  const tripId = `trip_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const startTime = new Date().toISOString();

  const trip: Trip = {
    id: tripId,
    userId,
    name: metadata?.name || `Trip ${new Date().toLocaleDateString()}`,
    startTime,
    distance: 0,
    duration: 0,
    route: [],
    status: 'active',
    source: metadata?.source,
    destination: metadata?.destination,
    vehicle: metadata?.vehicle,
  };

  activeTrips.set(tripId, trip);
  tripPoints.set(tripId, []);

  return {
    success: true,
    tripId,
    startTime,
  };
}

export async function stopTrip(userId: string, tripId: string): Promise<StopTripResponse> {
  await delay(400);

  const trip = activeTrips.get(tripId);
  if (!trip || trip.userId !== userId) {
    throw new Error('Trip not found');
  }

  const points = tripPoints.get(tripId) || [];
  const endTime = new Date().toISOString();
  const duration = Math.floor(
    (new Date(endTime).getTime() - new Date(trip.startTime).getTime()) / 1000
  );

  // Calculate distance
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    distance += calculateDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }

  const completedTrip: Trip = {
    ...trip,
    endTime,
    duration,
    distance,
    route: points,
    status: 'completed',
  };

  activeTrips.delete(tripId);

  return {
    success: true,
    trip: completedTrip,
  };
}

export async function uploadPoints(
  userId: string,
  tripId: string,
  points: GPSPoint[]
): Promise<void> {
  await delay(200);

  const trip = activeTrips.get(tripId);
  if (!trip || trip.userId !== userId) {
    throw new Error('Trip not found');
  }

  const existingPoints = tripPoints.get(tripId) || [];
  tripPoints.set(tripId, [...existingPoints, ...points]);
}

export async function heartbeat(userId: string, status: HeartbeatStatus): Promise<void> {
  await delay(100);
  console.log(`Heartbeat from user ${userId}:`, status);
}

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
