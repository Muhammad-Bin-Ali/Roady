import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { TrackingProvider } from '@/contexts/TrackingContext';
import AuthScreen from '@/screens/Auth/AuthScreen';
import SplashScreen from '@/screens/Auth/SplashScreen';
import GlobeScreen from '@/screens/Globe/GlobeScreen';
import TripsSheet from '@/components/TripsSheet';
import ProfileSheet from '@/components/ProfileSheet';
import PassportScreen from '@/screens/Passport/PassportScreen';

function MainApp() {
  const [showProfile, setShowProfile] = useState(false);
  const [showPassport, setShowPassport] = useState(false);

  return (
    <TrackingProvider>
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Full Screen Globe/Map */}
        <main className="flex-1">
          <GlobeScreen />
        </main>

        {/* Bottom Sheet with Trips */}
        <TripsSheet onOpenProfile={() => setShowProfile(true)} />

        {/* Profile Sheet */}
        <ProfileSheet 
          isOpen={showProfile} 
          onClose={() => setShowProfile(false)}
          onOpenPassport={() => setShowPassport(true)}
        />

        {/* Passport Screen */}
        <AnimatePresence>
          {showPassport && (
            <PassportScreen onClose={() => setShowPassport(false)} />
          )}
        </AnimatePresence>
      </div>
    </TrackingProvider>
  );
}

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <MainApp />;
}
