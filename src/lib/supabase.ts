
import { createClient } from '@supabase/supabase-js';

// Get Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yfuwzthvuuyhupzlbkxj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdXd6dGh2dXV5aHVwemxia3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDc1MTAsImV4cCI6MjA2MTQyMzUxMH0.m029Q9R90ERJj0A2pbNULo1jNGYt8XudVSnBr7MH7mk';

// Create and export the Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
  }
});

// Constants for storage buckets
export const SONG_BUCKET_NAME = 'songs';
export const ARTIST_IMAGE_BUCKET_NAME = 'artist-images';

// Create storage buckets if they don't exist
const createBucketIfNotExists = async (bucketName: string) => {
  try {
    // First check if bucket exists
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error) {
      // Only attempt to create if the error is that the bucket doesn't exist
      // Silently ignore RLS policy errors as the buckets may have already been created
      if (error.message.includes('not found')) {
        try {
          console.log(`Creating bucket: ${bucketName}`);
          const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
          });
          
          if (createError) {
            console.error(`Error creating bucket ${bucketName}:`, createError);
          } else {
            console.log(`Bucket ${bucketName} created successfully`);
          }
        } catch (createErr) {
          console.error(`Could not create bucket ${bucketName}:`, createErr);
          // Continue execution even if bucket creation fails
        }
      } else {
        console.log(`Note: Bucket ${bucketName} access check returned:`, error.message);
      }
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
  } catch (err) {
    console.error(`Error checking/creating bucket ${bucketName}:`, err);
    // Continue execution even if bucket check fails
  }
};

// Try to create required buckets, but don't block execution
(async () => {
  try {
    await createBucketIfNotExists(SONG_BUCKET_NAME);
    await createBucketIfNotExists(ARTIST_IMAGE_BUCKET_NAME);
  } catch (error) {
    console.error("Error creating storage buckets:", error);
    // Continue execution even if bucket creation fails
  }
})();

// Helper function to get a public URL for a file
export const getPublicUrl = (bucketName: string, filePath: string) => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
};

// Initialize session check
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    console.info('Initial session check: Session found');
  } else {
    console.info('Initial session check: No session');
  }
});

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.info(`Auth state changed: ${event}`, session ? 'Session exists' : 'No session');
});
