import type { AuthResponse, SignUpParams, LoginParams } from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function signUp(params: SignUpParams): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to sign up',
      };
    }

    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: 'Network error',
    };
  }
}

export async function login(params: LoginParams): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to login',
      };
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Network error',
    };
  }
}

export async function refreshSession(token: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Session expired',
      };
    }

    return data;
  } catch (error) {
    console.error('Session refresh error:', error);
    return {
      success: false,
      error: 'Network error',
    };
  }
}

export async function logout(userId: string): Promise<void> {
  // Client-side logout is sufficient for this stateless token approach
  console.log(`User ${userId} logged out`);
}
