
import { createClient } from '@supabase/supabase-js';

// Get Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Function to create the Supabase client with appropriate credentials
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials. Please check your environment variables.');
    
    // Provide fallback values to prevent runtime errors
    // This will allow the app to at least load, though authentication won't work
    // until proper environment variables are provided
    const fallbackUrl = 'https://yfuwzthvuuyhupzlbkxj.supabase.co';
    const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdXd6dGh2dXV5aHVwemxia3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDc1MTAsImV4cCI6MjA2MTQyMzUxMH0.m029Q9R90ERJj0A2pbNULo1jNGYt8XudVSnBr7MH7mk';
    
    return createClient(fallbackUrl, fallbackKey);
  } else {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
}

// Create and export the Supabase client
export const supabase = createSupabaseClient();
