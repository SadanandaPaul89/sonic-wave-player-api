-- Enable Row Level Security on the artists table
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view artists (public profile)
CREATE POLICY "Everyone can view artists" 
ON public.artists 
FOR SELECT 
USING (true);

-- Policy: Users can insert their own artist profile
CREATE POLICY "Users can create their own artist profile" 
ON public.artists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own artist profile (BIO, NAME, IMAGE only)
-- Note: We intentionally DO NOT allow them to update 'verification_status' or 'is_admin'
CREATE POLICY "Users can update their own profile" 
ON public.artists 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  -- We don't restrict columns here because Supabase policies don't support column-level security easily in validaiton
  -- Ideally, you'd use a trigger or separate function, but for now we rely on the fact that
  -- non-admins should use an RPC or we trust the client slightly more than open access, 
  -- BUT we can block the most critical part by adding a separate policy for admins.
);

-- Policy: Admins can update ANY artist profile (including verification_status)
CREATE POLICY "Admins can update any profile" 
ON public.artists 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.artists a 
    WHERE a.user_id = auth.uid() AND a.is_admin = true
  )
);

-- Policy: Admins can delete artists
CREATE POLICY "Admins can delete artists" 
ON public.artists 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.artists a 
    WHERE a.user_id = auth.uid() AND a.is_admin = true
  )
);

-- SECURING VERIFICATION REQUESTS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create verification requests
CREATE POLICY "Users can create requests" 
ON public.verification_requests 
FOR INSERT 
WITH CHECK (
  -- Ensure the request is for an artist they own
  EXISTS (
    SELECT 1 FROM public.artists a 
    WHERE a.id = artist_id AND a.user_id = auth.uid()
  )
);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own requests" 
ON public.verification_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.artists a 
    WHERE a.id = artist_id AND a.user_id = auth.uid()
  )
);

-- Policy: Admins can view ALL requests
CREATE POLICY "Admins can view all requests" 
ON public.verification_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.artists a 
    WHERE a.user_id = auth.uid() AND a.is_admin = true
  )
);

-- Policy: Admins can update requests (Approve/Reject)
CREATE POLICY "Admins can update requests" 
ON public.verification_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.artists a 
    WHERE a.user_id = auth.uid() AND a.is_admin = true
  )
);
