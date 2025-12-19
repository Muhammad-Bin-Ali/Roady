import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Settings, ChevronRight, Map } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getTrips } from '@/api/trips';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Trip } from '@/types/models';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPassport: () => void;
}

export default function ProfileSheet({ isOpen, onClose, onOpenPassport }: ProfileSheetProps) {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('All-Time');

  useEffect(() => {
    if (isOpen && user) {
      loadTrips();
    }
  }, [isOpen, user]);

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

  const visitedStates = 5; // Mock
  const years = ['All-Time', '2024', '2023', '2022', '2021', '20'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden"
      >
        <div className="bg-card rounded-t-[2rem] border-t border-border/50">
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-primary/50">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">{user?.username}</h2>
                <p className="text-sm text-muted-foreground">My trip log</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 px-5 pb-4">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Road Trip Friends</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>

          {/* Year Tabs */}
          <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedYear === year
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          {/* Passport Card */}
          <div className="px-5 py-4">
            <motion.button
              onClick={() => {
                onClose();
                setTimeout(onOpenPassport, 300);
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-left relative overflow-hidden group"
            >
              <div className="absolute top-3 right-3">
                <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
              </div>
              
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-white">
                  {selectedYear === 'All-Time' ? 'All-Time' : selectedYear} Road Trip Passport
                </h3>
              </div>
              <p className="text-xs text-white/60 mb-4">Passport · Pass · Pasaporte</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-xs text-white/60">Trips</p>
                  <p className="text-3xl font-bold text-white">{trips.length}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Distance (Miles)</p>
                  <p className="text-3xl font-bold text-white">
                    {Math.round(totalDistance / 1609.34).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-xs text-white/60">Drive time</p>
                  <p className="text-xl font-bold text-white">
                    {totalDays > 0 ? `${totalDays}d ` : ''}{remainingHours}h
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/60">States</p>
                  <p className="text-xl font-bold text-white">{visitedStates}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Vehicles</p>
                  <p className="text-xl font-bold text-white">1</p>
                </div>
              </div>

              {/* Learn More */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                <span className="text-sm font-medium text-white">Learn More</span>
                <ChevronRight className="w-5 h-5 text-white/60" />
              </div>
            </motion.button>
          </div>

          {/* Sign Out */}
          <div className="px-5 pb-8">
            <button
              onClick={logout}
              className="w-full py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
