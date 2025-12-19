import React from 'react';
import { motion } from 'framer-motion';
import { Car, Loader2 } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
          <Car className="w-16 h-16 text-primary-foreground" />
        </div>
        <div className="absolute -inset-8 rounded-full bg-primary/20 blur-3xl -z-10" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <h1 className="text-3xl font-bold text-gradient mb-4">RoadTrip</h1>
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </motion.div>
    </div>
  );
}
