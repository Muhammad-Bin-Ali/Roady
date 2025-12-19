import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, MapPin, Clock, Route, Car, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getTrips } from '@/api/trips';
import type { Trip } from '@/types/models';

interface PassportScreenProps {
  onClose: () => void;
}

export default function PassportScreen({ onClose }: PassportScreenProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('All-Time');
  const { user } = useAuth();

  useEffect(() => {
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    if (!user) return;
    try {
      const data = await getTrips(user.id);
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    }
  };

  // Calculate stats
  const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
  const totalDuration = trips.reduce((sum, t) => sum + t.duration, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  // Get unique states/regions (mock for now)
  const visitedStates = ['CA', 'NV', 'AZ', 'TX', 'CO'];
  
  const years = ['All-Time', '2024', '2023', '2022', '2021'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950"
    >
      {/* Header */}
      <div className="safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Road Trip Passport</h1>
          <button className="w-10 h-10 rounded-full glass flex items-center justify-center">
            <Share2 className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Year Tabs */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedYear === year
                  ? 'bg-foreground text-background'
                  : 'bg-white/10 text-foreground/70 hover:bg-white/20'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Map Preview */}
      <div className="px-4 py-6">
        <div className="relative h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-3xl overflow-hidden border border-white/10">
          {/* Simplified US map outline */}
          <svg viewBox="0 0 200 100" className="w-full h-full opacity-30">
            <path
              d="M20,40 L30,35 L50,30 L70,32 L90,28 L110,30 L130,35 L150,30 L170,35 L180,45 L175,55 L170,65 L160,70 L140,72 L120,75 L100,72 L80,75 L60,70 L40,68 L25,60 L20,50 Z"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          </svg>
          
          {/* Route lines (mock) */}
          <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full">
            <path
              d="M40,55 C60,50 80,45 100,50 C120,55 140,48 160,52"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4,4"
              className="animate-pulse"
            />
            <circle cx="40" cy="55" r="3" fill="hsl(var(--primary))" />
            <circle cx="160" cy="52" r="3" fill="hsl(var(--accent))" />
          </svg>

          {/* Country flags */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {visitedStates.map((state, i) => (
              <div
                key={state}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center text-[8px] font-bold text-primary-foreground"
              >
                {state}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Passport Card */}
      <div className="px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 rounded-3xl p-6 border border-white/10 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {selectedYear === 'All-Time' ? 'All-Time' : selectedYear} Road Trip Passport
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Passport · Pass · Pasaporte
              </p>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Trips</p>
              <p className="text-4xl font-bold text-foreground">{trips.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Distance (Miles)</p>
              <p className="text-4xl font-bold text-foreground">
                {Math.round(totalDistance / 1609.34).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Drive time</p>
              <p className="text-2xl font-bold text-foreground">
                {totalDays > 0 ? `${totalDays}d ` : ''}{remainingHours}h
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">States</p>
              <p className="text-2xl font-bold text-foreground">{visitedStates.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Vehicles</p>
              <p className="text-2xl font-bold text-foreground">1</p>
            </div>
          </div>

          {/* Passport Code */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[8px] text-muted-foreground/50 font-mono tracking-widest text-center">
              P&lt;USA&lt;{user?.username?.toUpperCase() || 'ROADTRIPPER'}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;ROADTRIP&lt;&lt;&lt;&lt;&lt;&lt;
            </p>
            <p className="text-[8px] text-muted-foreground/50 font-mono tracking-widest text-center mt-1">
              ISSUED{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase().replace(/ /g, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;ROADTRIP.APP&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
            </p>
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="px-4 mt-4 pb-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-900/60 to-orange-900/60 rounded-3xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold text-foreground">
              {Math.round(totalDistance / 1609.34 / Math.max(trips.length, 1))}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">avg miles per trip</p>
              <p className="text-xs text-muted-foreground">
                Your longest trip was {Math.round(Math.max(...trips.map(t => t.distance), 0) / 1609.34)} miles
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
