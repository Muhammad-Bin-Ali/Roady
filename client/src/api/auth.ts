import type { AuthResponse, SignUpParams, LoginParams } from '@/types/api';
import type { User } from '@/types/models';

// Mock user store for development
const mockUsers: Map<string, { user: User; password: string }> = new Map();

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate mock token
const generateToken = (): string => {
  return `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};

// Generate user ID
const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};

export async function signUp(params: SignUpParams): Promise<AuthResponse> {
  await delay(800);

  const { email, username, password } = params;

  // Check if email already exists
  for (const [, data] of mockUsers) {
    if (data.user.email === email) {
      return {
        success: false,
        error: 'Email already registered',
      };
    }
    if (data.user.username === username) {
      return {
        success: false,
        error: 'Username already taken',
      };
    }
  }

  const user: User = {
    id: generateUserId(),
    email,
    username,
    createdAt: new Date().toISOString(),
  };

  const token = generateToken();
  mockUsers.set(user.id, { user, password });

  return {
    success: true,
    user,
    token,
  };
}

export async function login(params: LoginParams): Promise<AuthResponse> {
  await delay(600);

  const { emailOrUsername, password } = params;

  // Find user by email or username
  for (const [, data] of mockUsers) {
    if (
      (data.user.email === emailOrUsername || data.user.username === emailOrUsername) &&
      data.password === password
    ) {
      return {
        success: true,
        user: data.user,
        token: generateToken(),
      };
    }
  }

  // For demo purposes, create a mock user on first login attempt
  if (mockUsers.size === 0) {
    const mockUser: User = {
      id: generateUserId(),
      email: emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@demo.com`,
      username: emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername,
      createdAt: new Date().toISOString(),
    };

    const token = generateToken();
    mockUsers.set(mockUser.id, { user: mockUser, password });

    return {
      success: true,
      user: mockUser,
      token,
    };
  }

  return {
    success: false,
    error: 'Invalid credentials',
  };
}

export async function refreshSession(token: string): Promise<AuthResponse> {
  await delay(300);

  // In a real app, validate the token and return refreshed session
  // For mock, just return success with a new token
  if (token && token.startsWith('mock_token_')) {
    return {
      success: true,
      token: generateToken(),
    };
  }

  return {
    success: false,
    error: 'Invalid or expired token',
  };
}

export async function logout(userId: string): Promise<void> {
  await delay(200);
  // In a real app, invalidate the session on the server
  console.log(`User ${userId} logged out`);
}
