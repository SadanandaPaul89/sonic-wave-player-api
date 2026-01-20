// Authentication configuration
// Set USE_LOCAL_AUTH to true to use local auth, false to use Supabase
export const USE_LOCAL_AUTH = false;

// Export the appropriate auth service based on configuration
export const getAuthService = async () => {
  if (USE_LOCAL_AUTH) {
    const { auth } = await import('@/services/localAuth');
    return auth;
  } else {
    const { supabase } = await import('@/lib/supabase');
    return supabase.auth;
  }
};

// Helper function to check if we're using local auth
export const isUsingLocalAuth = () => USE_LOCAL_AUTH;