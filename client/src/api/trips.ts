import type { Trip, TripSummary } from '@/types/models';
import type { NewTripPayload, ApiResponse } from '@/types/api';

// Mock trip data
const mockTrips: Map<string, Trip[]> = new Map();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate sample trips for demo
const generateMockTrips = (userId: string): Trip[] => {
  const trips: Trip[] = [
    {
      id: 'trip_1',
      userId,
      name: 'Pacific Coast Highway',
      startTime: '2024-01-15T08:30:00Z',
      endTime: '2024-01-15T14:45:00Z',
      distance: 285000,
      duration: 22500,
      maxSpeed: 35,
      avgSpeed: 12.7,
      route: generateMockRoute(34.0522, -118.2437, 36.7783, -119.4179, 50),
      status: 'completed',
    },
    {
      id: 'trip_2',
      userId,
      name: 'Weekend Mountain Drive',
      startTime: '2024-01-20T10:00:00Z',
      endTime: '2024-01-20T16:30:00Z',
      distance: 156000,
      duration: 23400,
      maxSpeed: 28,
      avgSpeed: 6.7,
      route: generateMockRoute(39.7392, -104.9903, 40.0150, -105.2705, 35),
      status: 'completed',
    },
    {
      id: 'trip_3',
      userId,
      name: 'City to Coast',
      startTime: '2024-02-01T07:00:00Z',
      endTime: '2024-02-01T09:30:00Z',
      distance: 95000,
      duration: 9000,
      maxSpeed: 32,
      avgSpeed: 10.6,
      route: generateMockRoute(37.7749, -122.4194, 37.4419, -122.1430, 25),
      status: 'completed',
    },
    {
      id: 'trip_4',
      userId,
      name: 'Desert Adventure',
      startTime: '2024-02-10T06:00:00Z',
      endTime: '2024-02-10T18:00:00Z',
      distance: 420000,
      duration: 43200,
      maxSpeed: 40,
      avgSpeed: 9.7,
      route: generateMockRoute(33.4484, -112.0740, 36.1699, -115.1398, 60),
      status: 'completed',
    },
  ];

  return trips;
};

function generateMockRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  points: number
): Trip['route'] {
  const route: Trip['route'] = [];
  const latStep = (endLat - startLat) / points;
  const lngStep = (endLng - startLng) / points;

  for (let i = 0; i <= points; i++) {
    const variation = Math.random() * 0.02 - 0.01;
    route.push({
      latitude: startLat + latStep * i + variation,
      longitude: startLng + lngStep * i + variation,
      speed: Math.random() * 30 + 5,
      timestamp: new Date(Date.now() - (points - i) * 60000).toISOString(),
    });
  }

  return route;
}

export async function getTrips(userId: string): Promise<Trip[]> {
  await delay(500);

  if (!mockTrips.has(userId)) {
    mockTrips.set(userId, generateMockTrips(userId));
  }

  return mockTrips.get(userId) || [];
}

export async function getTrip(userId: string, tripId: string): Promise<Trip | null> {
  await delay(300);

  const trips = await getTrips(userId);
  return trips.find(t => t.id === tripId) || null;
}

export async function createTrip(
  userId: string,
  tripData: NewTripPayload
): Promise<ApiResponse<Trip>> {
  await delay(400);

  const trip: Trip = {
    id: `trip_${Date.now()}`,
    userId,
    name: tripData.name,
    startTime: tripData.startTime,
    distance: 0,
    duration: 0,
    route: tripData.initialPoint ? [tripData.initialPoint] : [],
    status: 'active',
  };

  const userTrips = mockTrips.get(userId) || [];
  userTrips.unshift(trip);
  mockTrips.set(userId, userTrips);

  return {
    success: true,
    data: trip,
  };
}

export async function getTripSummaries(userId: string): Promise<TripSummary[]> {
  const trips = await getTrips(userId);

  return trips.map(trip => ({
    id: trip.id,
    name: trip.name,
    date: trip.startTime,
    distance: trip.distance,
    duration: trip.duration,
    routePreview: trip.route.slice(0, 20).map(p => [p.longitude, p.latitude] as [number, number]),
  }));
}
