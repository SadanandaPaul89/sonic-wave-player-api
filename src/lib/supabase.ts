
import { createClient } from '@supabase/supabase-js';

// Try to get Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-supabase-url.com';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-supabase-key';

// Create a custom mock client when real credentials aren't available
const isMockClient = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

if (isMockClient) {
  console.warn('Using mock Supabase client. For production, please connect to a real Supabase project.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Override auth methods with mock implementations if using mock client
if (isMockClient) {
  // Store mock user data in localStorage to simulate persistence
  const localStorageKey = 'mock_supabase_auth';
  
  // Mock user session management
  const getMockUser = () => {
    try {
      const userData = localStorage.getItem(localStorageKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting mock user:', error);
      return null;
    }
  };

  const setMockUser = (user: any) => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting mock user:', error);
    }
  };

  // Create a dummy session
  const createMockSession = (user: any) => {
    return {
      user,
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: new Date().getTime() + 3600 * 1000
    };
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
      const session = user ? createMockSession(user) : null;
      return { data: { session }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      console.log('Mock sign in attempt:', { email, password });
      
      // Basic validation - in a real app, you'd verify against a database
      if (email && password && password.length >= 6) {
        const user = { 
          id: 'mock-user-id',
          email, 
          user_metadata: { full_name: email.split('@')[0] },
          created_at: new Date().toISOString()
        };
        setMockUser(user);
        const session = createMockSession(user);
        
        // Dispatch a custom event to notify listeners of auth state change
        window.dispatchEvent(new CustomEvent('supabase.auth.stateChange', { 
          detail: { event: 'SIGNED_IN', session } 
        }));
        
        return { data: { user, session }, error: null };
      }
      return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      console.log('Mock sign up attempt:', { email, password });
      
      if (email && password && password.length >= 6) {
        const user = { 
          id: 'mock-user-id-' + new Date().getTime(),
          email, 
          user_metadata: { full_name: email.split('@')[0] },
          created_at: new Date().toISOString()
        };
        setMockUser(user);
        const session = createMockSession(user);
        
        // Dispatch a custom event to notify listeners of auth state change
        window.dispatchEvent(new CustomEvent('supabase.auth.stateChange', { 
          detail: { event: 'SIGNED_IN', session } 
        }));
        
        return { data: { user, session }, error: null };
      }
      return { data: { user: null, session: null }, error: { message: 'Failed to sign up' } };
    },
    signOut: async () => {
      console.log('Mock sign out');
      localStorage.removeItem(localStorageKey);
      
      // Dispatch a custom event to notify listeners of auth state change
      window.dispatchEvent(new CustomEvent('supabase.auth.stateChange', { 
        detail: { event: 'SIGNED_OUT', session: null } 
      }));
      
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      console.log('Mock auth state change listener registered');
      
      // Add real listener for our custom events
      const listener = (event: any) => {
        const { detail } = event;
        callback(detail.event, detail.session);
      };
      
      window.addEventListener('supabase.auth.stateChange', listener);
      
      // Return a real unsubscribe function
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              window.removeEventListener('supabase.auth.stateChange', listener);
            } 
          } 
        } 
      };
    },
  } as any;  // Type assertion to avoid TypeScript errors

  console.log('Using mock Supabase client for development');
} else {
  console.log('Using real Supabase client');
}
