// Local authentication service for development
export interface LocalUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

// Predefined test users for easy development
const TEST_USERS = [
  {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    id: 'user_test_001'
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    id: 'user_admin_001'
  },
  {
    email: 'artist@example.com',
    password: 'artist123',
    name: 'Artist User',
    id: 'user_artist_001'
  },
  {
    email: 'demo@sonicwave.com',
    password: 'demo123',
    name: 'Demo User',
    id: 'user_demo_001'
  }
];

export interface LocalSession {
  user: LocalUser;
  access_token: string;
  expires_at: number;
}

class LocalAuthService {
  private static instance: LocalAuthService;
  private session: LocalSession | null = null;
  private listeners: Array<(event: string, session: LocalSession | null) => void> = [];

  private constructor() {
    // Load session from localStorage on initialization
    this.loadSession();
  }

  static getInstance(): LocalAuthService {
    if (!LocalAuthService.instance) {
      LocalAuthService.instance = new LocalAuthService();
    }
    return LocalAuthService.instance;
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem('local_auth_session');
      if (stored) {
        const session = JSON.parse(stored) as LocalSession;
        // Check if session is still valid (24 hours)
        if (session.expires_at > Date.now()) {
          this.session = session;
        } else {
          localStorage.removeItem('local_auth_session');
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      localStorage.removeItem('local_auth_session');
    }
  }

  private saveSession(session: LocalSession) {
    try {
      localStorage.setItem('local_auth_session', JSON.stringify(session));
      this.session = session;
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private clearSession() {
    localStorage.removeItem('local_auth_session');
    this.session = null;
  }

  private generateToken(): string {
    return 'local_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substring(2);
  }

  private notifyListeners(event: string, session: LocalSession | null) {
    this.listeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  // Simulate sign in with email/password
  async signInWithPassword(email: string, password: string): Promise<{ data: { session: LocalSession } | null; error: Error | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simple validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Check against predefined test users first
      const testUser = TEST_USERS.find(u => u.email === email && u.password === password);
      
      let user: LocalUser;
      
      if (testUser) {
        // Use predefined test user
        user = {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          created_at: new Date().toISOString(),
        };
      } else {
        // Create new mock user for any other credentials
        user = {
          id: this.generateUserId(),
          email,
          name: email.split('@')[0],
          created_at: new Date().toISOString(),
        };
      }

      const session: LocalSession = {
        user,
        access_token: this.generateToken(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };

      this.saveSession(session);
      this.notifyListeners('SIGNED_IN', session);

      return { data: { session }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Simulate sign up with email/password
  async signUp(email: string, password: string): Promise<{ data: { session: LocalSession | null; user: LocalUser } | null; error: Error | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Simple validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Create mock user
      const user: LocalUser = {
        id: this.generateUserId(),
        email,
        name: email.split('@')[0],
        created_at: new Date().toISOString(),
      };

      // Create session immediately (no email confirmation needed for local auth)
      const session: LocalSession = {
        user,
        access_token: this.generateToken(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };

      this.saveSession(session);
      this.notifyListeners('SIGNED_IN', session);

      return { data: { session, user }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Simulate OAuth sign in (Google)
  async signInWithOAuth(provider: string): Promise<{ error: Error | null }> {
    try {
      // Simulate OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Create mock user with OAuth provider
      const user: LocalUser = {
        id: this.generateUserId(),
        email: `user@${provider}.com`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        created_at: new Date().toISOString(),
      };

      const session: LocalSession = {
        user,
        access_token: this.generateToken(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };

      this.saveSession(session);
      this.notifyListeners('SIGNED_IN', session);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Get current session
  async getSession(): Promise<{ data: { session: LocalSession | null }; error: Error | null }> {
    try {
      return { data: { session: this.session }, error: null };
    } catch (error) {
      return { data: { session: null }, error: error as Error };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const currentSession = this.session;
      this.clearSession();
      this.notifyListeners('SIGNED_OUT', null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: LocalSession | null) => void) {
    this.listeners.push(callback);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
              this.listeners.splice(index, 1);
            }
          }
        }
      }
    };
  }

  // Get current user
  getCurrentUser(): LocalUser | null {
    return this.session?.user || null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.session !== null && this.session.expires_at > Date.now();
  }
}

// Export singleton instance
export const localAuth = LocalAuthService.getInstance();

// Export auth object that mimics Supabase auth API
export const auth = {
  signInWithPassword: (credentials: { email: string; password: string }) => 
    localAuth.signInWithPassword(credentials.email, credentials.password),
  
  signUp: (credentials: { email: string; password: string }) => 
    localAuth.signUp(credentials.email, credentials.password),
  
  signInWithOAuth: (options: { provider: string; options?: any }) => 
    localAuth.signInWithOAuth(options.provider),
  
  getSession: () => localAuth.getSession(),
  
  signOut: () => localAuth.signOut(),
  
  onAuthStateChange: (callback: (event: string, session: LocalSession | null) => void) => 
    localAuth.onAuthStateChange(callback),
};