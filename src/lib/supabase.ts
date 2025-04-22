
import { createClient } from '@supabase/supabase-js';

// Try to get Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-supabase-url.com';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-supabase-key';

// Create a custom mock client when real credentials aren't available
const isMockClient = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Override auth methods with mock implementations if using mock client
if (isMockClient) {
  // Store mock user data in localStorage to simulate persistence
  const localStorageKey = 'mock_supabase_auth';
  
  // Mock user session management
  const getMockUser = () => {
    const userData = localStorage.getItem(localStorageKey);
    return userData ? JSON.parse(userData) : null;
  };

  const setMockUser = (user: any) => {
    localStorage.setItem(localStorageKey, JSON.stringify(user));
  };

  // Override auth methods with mock implementations
  supabase.auth = {
    ...supabase.auth,
    getUser: async () => {
      const user = getMockUser();
      return { data: { user }, error: null };
    },
    getSession: async () => {
      const user = getMockUser();
      const session = user ? { user } : null;
      return { data: { session }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Very basic validation
      if (email && password.length >= 6) {
        const user = { id: 'mock-user-id', email, created_at: new Date().toISOString() };
        setMockUser(user);
        return { data: { user }, error: null };
      }
      return { data: null, error: { message: 'Invalid login credentials' } };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      if (email && password.length >= 6) {
        const user = { id: 'mock-user-id', email, created_at: new Date().toISOString() };
        setMockUser(user);
        return { data: { user }, error: null };
      }
      return { data: null, error: { message: 'Failed to sign up' } };
    },
    signOut: async () => {
      localStorage.removeItem(localStorageKey);
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      // Return a mock unsubscribe function
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  } as any;  // Type assertion to avoid TypeScript errors

  console.log('Using mock Supabase client for development');
} else {
  console.log('Using real Supabase client');
}
