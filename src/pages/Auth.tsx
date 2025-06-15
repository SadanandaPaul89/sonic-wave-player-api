import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, Loader, Github, LucideIcon, LucideProps } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';

const Auth = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    // Clear error when switching tabs
    setError(null);
  }, [activeTab]);

  const validateInputs = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateInputs()) return;
    
    setLoading(true);
    
    try {
      console.log('Attempting to sign in with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Sign in successful:', data);
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in');
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateInputs()) return;
    
    setLoading(true);
    
    try {
      console.log('Attempting to sign up with:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Sign up successful:', data);
      
      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        toast.info('Please check your email for confirmation link');
      } else {
        toast.success('Account created successfully!');
      }
      
      // Navigate to home if auto-confirmation is enabled
      if (data?.session) {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to create account');
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Google login handler
  const handleSignInWithGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      // You may want to set redirectTo to window.location.origin or your custom page
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + "/",
        },
      });

      if (error) {
        setError(error.message || 'Could not sign in with Google');
        toast.error(error.message || 'Could not sign in with Google');
      }
    } catch (error: any) {
      setError(error.message || 'Could not sign in with Google');
      toast.error(error.message || 'Could not sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={`container flex items-center justify-center min-h-screen ${isMobile ? 'px-4 py-8' : ''}`}>
      <Card className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} bg-spotify-elevated`}>
        <CardHeader className="space-y-1">
          <CardTitle className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-center`}>
            Welcome to Sonic Wave
          </CardTitle>
          <CardDescription className="text-center">
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" className={`${isMobile ? 'text-sm' : ''}`}>Login</TabsTrigger>
              <TabsTrigger value="register" className={`${isMobile ? 'text-sm' : ''}`}>Register</TabsTrigger>
            </TabsList>
            
            {error && (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="login">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className={`${isMobile ? 'h-12 text-base' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className={`${isMobile ? 'h-12 text-base' : ''}`}
                  />
                </div>
                <Button 
                  type="submit"
                  className={`w-full ${isMobile ? 'h-12 text-base' : ''}`}
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
                <div className="flex items-center my-2">
                  <div className="flex-grow border-t border-muted" />
                  <span className="mx-2 text-xs text-muted-foreground">or</span>
                  <div className="flex-grow border-t border-muted" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'h-12 text-base' : ''}`}
                  onClick={handleSignInWithGoogle}
                  disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" aria-hidden="true">
                      <g>
                        <path fill="#4285F4" d="M21.805 10.023h-9.766v3.953h5.672c-.246 1.196-.997 2.21-2.01 2.885v2.383h3.244c1.902-1.752 2.861-4.338 2.861-7.074 0-.481-.04-.956-.122-1.423z"/>
                        <path fill="#34A853" d="M12.039 21.653c2.611 0 4.805-.87 6.406-2.352l-3.244-2.383c-.898.607-2.047.963-3.162.963-2.429 0-4.487-1.64-5.227-3.832h-3.291v2.407c1.594 3.148 4.916 5.197 8.518 5.197z"/>
                        <path fill="#FBBC05" d="M6.812 14.349A5.195 5.195 0 0 1 6.225 12c0-.819.147-1.615.406-2.349V7.244h-3.29A9.414 9.414 0 0 0 2.04 12c0 1.484.357 2.891.989 4.117l3.283-2.407z"/>
                        <path fill="#EA4335" d="M12.039 6.987c1.427 0 2.704.492 3.71 1.457l2.773-2.774C16.84 3.939 14.65 3 12.039 3c-3.602 0-6.924 2.049-8.518 5.197l3.291 2.407c.74-2.192 2.798-3.834 5.227-3.834z"/>
                      </g>
                    </svg>
                  )}
                  Sign in with Google
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className={`${isMobile ? 'h-12 text-base' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading || googleLoading}
                    className={`${isMobile ? 'h-12 text-base' : ''}`}
                  />
                  <p className="text-xs text-gray-400">Password must be at least 6 characters</p>
                </div>
                <Button 
                  type="submit"
                  className={`w-full ${isMobile ? 'h-12 text-base' : ''}`}
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
                <div className="flex items-center my-2">
                  <div className="flex-grow border-t border-muted" />
                  <span className="mx-2 text-xs text-muted-foreground">or</span>
                  <div className="flex-grow border-t border-muted" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'h-12 text-base' : ''}`}
                  onClick={handleSignInWithGoogle}
                  disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" aria-hidden="true">
                      <g>
                        <path fill="#4285F4" d="M21.805 10.023h-9.766v3.953h5.672c-.246 1.196-.997 2.21-2.01 2.885v2.383h3.244c1.902-1.752 2.861-4.338 2.861-7.074 0-.481-.04-.956-.122-1.423z"/>
                        <path fill="#34A853" d="M12.039 21.653c2.611 0 4.805-.87 6.406-2.352l-3.244-2.383c-.898.607-2.047.963-3.162.963-2.429 0-4.487-1.64-5.227-3.832h-3.291v2.407c1.594 3.148 4.916 5.197 8.518 5.197z"/>
                        <path fill="#FBBC05" d="M6.812 14.349A5.195 5.195 0 0 1 6.225 12c0-.819.147-1.615.406-2.349V7.244h-3.29A9.414 9.414 0 0 0 2.04 12c0 1.484.357 2.891.989 4.117l3.283-2.407z"/>
                        <path fill="#EA4335" d="M12.039 6.987c1.427 0 2.704.492 3.71 1.457l2.773-2.774C16.84 3.939 14.65 3 12.039 3c-3.602 0-6.924 2.049-8.518 5.197l3.291 2.407c.74-2.192 2.798-3.834 5.227-3.834z"/>
                      </g>
                    </svg>
                  )}
                  Sign in with Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
