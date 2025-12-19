import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthState, User } from '@/types/models';
import * as authService from '@/services/authService';

interface AuthContextType extends AuthState {
  signUp: (email: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    // Initialize auth and subscribe to changes
    const unsubscribe = authService.subscribeToAuthChanges(setState);
    authService.initializeAuth();

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    ...state,
    signUp: authService.signUp,
    login: authService.login,
    logout: authService.logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
