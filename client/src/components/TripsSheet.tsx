import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { Search, ChevronDown, Share2, Loader2, Route, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getTrips } from '@/api/trips';
import TripCard from '@/components/TripCard';
import type { Trip } from '@/types/models';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TripsSheetProps {
  onOpenProfile: () => void;
}

export default function TripsSheet({ onOpenProfile }: TripsSheetProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetState, setSheetState] = useState<'expanded' | 'collapsed' | 'hidden'>('collapsed');
  const { user } = useAuth();
  const dragControls = useDragControls();

  useEffect(() => {
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getTrips(user.id);
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const { offset, velocity } = info;

    if (offset.y < -threshold || velocity.y < -500) {
      // Dragging Up
      if (sheetState === 'hidden') setSheetState('collapsed');
      else setSheetState('expanded');
    } else if (offset.y > threshold || velocity.y > 500) {
      // Dragging Down
      if (sheetState === 'expanded') setSheetState('collapsed');
      else setSheetState('hidden');
    }
  };

  const getY = () => {
    switch (sheetState) {
      case 'expanded': return 0;
      case 'collapsed': return '55%';
      case 'hidden': return 'calc(100% - 40px)';
    }
  };

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40"
      initial={{ y: '60%' }}
      animate={{ y: getY() }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      drag="y"
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-card rounded-t-[2rem] min-h-screen shadow-2xl border-t border-border/50">
        {/* Drag Handle */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">My Trips</h1>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-muted transition-colors">
                <Share2 className="w-5 h-5 text-foreground" />
              </button>
              <button 
                onClick={onOpenProfile}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 hover:border-primary transition-colors"
              >
                <Avatar className="w-full h-full">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search to add trips"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 rounded-2xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Welcome Card */}
        {sheetState !== 'expanded' && trips.length > 0 && (
          <div className="px-5 mb-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 relative"
            >
              <button className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-start gap-3">
                <div className="text-2xl">👋</div>
                <div>
                  <h3 className="font-semibold text-foreground">Welcome Back</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    You've completed {trips.length} trips. Keep exploring!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Trip List */}
        <div className="px-5 overflow-y-auto max-h-[60vh] pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Route className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No trips yet</h3>
              <p className="text-sm text-muted-foreground">
                Start your first road trip!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrips.map((trip, index) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={index}
                  onClick={() => console.log('Open trip:', trip.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
