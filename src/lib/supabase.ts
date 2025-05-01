
import { createClient } from '@supabase/supabase-js';

// Get Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yfuwzthvuuyhupzlbkxj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdXd6dGh2dXV5aHVwemxia3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDc1MTAsImV4cCI6MjA2MTQyMzUxMH0.m029Q9R90ERJj0A2pbNULo1jNGYt8XudVSnBr7MH7mk';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
