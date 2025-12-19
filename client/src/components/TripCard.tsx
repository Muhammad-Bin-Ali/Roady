import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock, Route, ChevronRight, TrendingUp } from 'lucide-react';
import type { Trip, TripSummary } from '@/types/models';

interface TripCardProps {
  trip: Trip | TripSummary;
  onClick?: () => void;
  index?: number;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

export default function TripCard({ trip, onClick, index = 0 }: TripCardProps) {
  const date = 'startTime' in trip ? trip.startTime : trip.date;
  const routePreview = 'routePreview' in trip 
    ? trip.routePreview 
    : trip.route?.slice(0, 20).map(p => [p.longitude, p.latitude] as [number, number]) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="trip-card p-4 cursor-pointer group"
    >
      <div className="flex gap-4">
        {/* Mini Map Preview */}
        <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id={`grad-${trip.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
            {routePreview.length > 1 && (
              <polyline
                fill="none"
                stroke={`url(#grad-${trip.id})`}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={normalizeRouteToSvg(routePreview)}
              />
            )}
            {/* Start marker */}
            {routePreview.length > 0 && (
              <circle
                cx={normalizeCoord(routePreview[0][0], routePreview.map(p => p[0]))}
                cy={100 - normalizeCoord(routePreview[0][1], routePreview.map(p => p[1]))}
                r="5"
                fill="hsl(var(--primary))"
              />
            )}
            {/* End marker */}
            {routePreview.length > 1 && (
              <circle
                cx={normalizeCoord(routePreview[routePreview.length - 1][0], routePreview.map(p => p[0]))}
                cy={100 - normalizeCoord(routePreview[routePreview.length - 1][1], routePreview.map(p => p[1]))}
                r="5"
                fill="hsl(var(--accent))"
              />
            )}
          </svg>
        </div>

        {/* Trip Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {trip.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(date), 'MMM d, yyyy')}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Route className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{formatDistance(trip.distance)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{formatDuration(trip.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper functions to normalize coordinates for SVG
function normalizeCoord(value: number, allValues: number[]): number {
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  return ((value - min) / range) * 80 + 10; // 10-90 range for padding
}

function normalizeRouteToSvg(route: [number, number][]): string {
  if (route.length === 0) return '';
  
  const lngs = route.map(p => p[0]);
  const lats = route.map(p => p[1]);
  
  return route
    .map(([lng, lat]) => {
      const x = normalizeCoord(lng, lngs);
      const y = 100 - normalizeCoord(lat, lats); // Flip Y for SVG
      return `${x},${y}`;
    })
    .join(' ');
}
