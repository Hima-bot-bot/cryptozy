// =====================================================
// 🔐 AUTHENTICATION CONTEXT
// =====================================================
// Manages user authentication state
// Works with Supabase when configured, falls back to local demo mode

import { isSupabaseReady, signIn, signUp, signOut, getCurrentUser } from './supabase';

export interface AppUser {
  id: string;
  email: string;
  username: string;
  isDemo: boolean;
}

// Check for existing session
export async function checkSession(): Promise<AppUser | null> {
  // Check Supabase first
  if (isSupabaseReady) {
    const user = await getCurrentUser();
    if (user) {
      return {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || 'User',
        isDemo: false,
      };
    }
    return null;
  }

  // Check local demo session
  const localUser = localStorage.getItem('trustify-user');
  if (localUser) {
    try {
      return JSON.parse(localUser);
    } catch {
      return null;
    }
  }
  return null;
}

// Login
export async function login(email: string, password: string): Promise<{ user: AppUser | null; error: string | null }> {
  if (isSupabaseReady) {
    const result = await signIn(email, password);
    if (result.error) return { user: null, error: result.error };
    if (result.user) {
      return {
        user: {
          id: result.user.id,
          email: result.user.email || email,
          username: result.user.user_metadata?.username || email.split('@')[0],
          isDemo: false,
        },
        error: null,
      };
    }
    return { user: null, error: 'Login failed' };
  }

  // Demo mode login — accept any credentials
  const user: AppUser = {
    id: 'demo_' + Math.random().toString(36).substr(2, 9),
    email,
    username: email.split('@')[0],
    isDemo: true,
  };
  localStorage.setItem('trustify-user', JSON.stringify(user));
  return { user, error: null };
}

// Register
export async function register(email: string, password: string, username: string): Promise<{ user: AppUser | null; error: string | null }> {
  if (isSupabaseReady) {
    const result = await signUp(email, password, username);
    if (result.error) return { user: null, error: result.error };
    if (result.user) {
      return {
        user: {
          id: result.user.id,
          email: result.user.email || email,
          username,
          isDemo: false,
        },
        error: null,
      };
    }
    return { user: null, error: 'Registration failed' };
  }

  // Demo mode register
  const user: AppUser = {
    id: 'demo_' + Math.random().toString(36).substr(2, 9),
    email,
    username,
    isDemo: true,
  };
  localStorage.setItem('trustify-user', JSON.stringify(user));
  return { user, error: null };
}

// Logout
export async function logout(): Promise<void> {
  if (isSupabaseReady) {
    await signOut();
  }
  localStorage.removeItem('trustify-user');
}
