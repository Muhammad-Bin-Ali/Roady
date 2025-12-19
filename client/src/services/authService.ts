import { Preferences } from '@capacitor/preferences';
import type { User, AuthState } from '@/types/models';
import * as authApi from '@/api/auth';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// In-memory state
let authState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
};

// State change listeners
const listeners: Set<(state: AuthState) => void> = new Set();

function notifyListeners(): void {
  listeners.forEach(listener => listener(authState));
}

// Save auth data to secure storage
async function persistAuth(token: string, user: User): Promise<void> {
  await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
  await Preferences.set({ key: USER_DATA_KEY, value: JSON.stringify(user) });
}

// Clear auth data from storage
async function clearAuth(): Promise<void> {
  await Preferences.remove({ key: AUTH_TOKEN_KEY });
  await Preferences.remove({ key: USER_DATA_KEY });
}

// Initialize auth state from storage
export async function initializeAuth(): Promise<AuthState> {
  try {
    const { value: token } = await Preferences.get({ key: AUTH_TOKEN_KEY });
    const { value: userData } = await Preferences.get({ key: USER_DATA_KEY });

    if (token && userData) {
      // Validate token with backend
      const response = await authApi.refreshSession(token);

      if (response.success) {
        // Use user from response if available, otherwise fallback to stored user
        const user = response.user || (JSON.parse(userData) as User);
        
        authState = {
          isAuthenticated: true,
          user,
          token: response.token || token,
          isLoading: false,
        };

        // Update stored data
        if (response.user) {
           await Preferences.set({ key: USER_DATA_KEY, value: JSON.stringify(response.user) });
        }
        if (response.token) {
          await Preferences.set({ key: AUTH_TOKEN_KEY, value: response.token });
        }
      } else {
        await clearAuth();
        authState = {
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
        };
      }
    } else {
      authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    }
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    };
  }

  notifyListeners();
  return authState;
}

// Sign up
export async function signUp(
  email: string,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authApi.signUp({ email, username, password });

    if (response.success && response.user && response.token) {
      await persistAuth(response.token, response.user);
      authState = {
        isAuthenticated: true,
        user: response.user,
        token: response.token,
        isLoading: false,
      };
      notifyListeners();
      return { success: true };
    }

    return { success: false, error: response.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign up failed',
    };
  }
}

// Login
export async function login(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authApi.login({ emailOrUsername, password });

    if (response.success && response.user && response.token) {
      await persistAuth(response.token, response.user);
      authState = {
        isAuthenticated: true,
        user: response.user,
        token: response.token,
        isLoading: false,
      };
      notifyListeners();
      return { success: true };
    }

    return { success: false, error: response.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

// Logout
export async function logout(): Promise<void> {
  if (authState.user) {
    await authApi.logout(authState.user.id);
  }
  await clearAuth();
  authState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
  };
  notifyListeners();
}

// Get current auth state
export function getAuthState(): AuthState {
  return { ...authState };
}

// Subscribe to auth state changes
export function subscribeToAuthChanges(listener: (state: AuthState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Get current user ID (helper)
export function getUserId(): string | null {
  return authState.user?.id ?? null;
}
