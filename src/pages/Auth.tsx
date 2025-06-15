
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, User, Lock } from 'lucide-react';
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
    setError(null);
    setEmail('');
    setPassword('');
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
      
      if (data?.user?.identities?.length === 0) {
        toast.info('Please check your email for confirmation link');
      } else {
        toast.success('Account created successfully!');
      }
      
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

  const handleSignInWithGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
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

  if (isMobile) {
    return (
      <div className="container flex items-center justify-center min-h-screen px-4 py-8">
        <Card className="w-full max-w-sm bg-spotify-elevated">
          <CardContent className="p-6">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-spotify-white">
                {activeTab === 'login' ? 'Login' : 'Register'}
              </h1>
            </div>

            <div className="flex mb-6 bg-spotify-base rounded-lg p-1">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 text-sm font-medium ${
                  activeTab === 'login'
                    ? 'bg-spotify-green text-black'
                    : 'text-spotify-lightgray hover:text-spotify-white'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 text-sm font-medium ${
                  activeTab === 'register'
                    ? 'bg-spotify-green text-black'
                    : 'text-spotify-lightgray hover:text-spotify-white'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={activeTab === 'login' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-spotify-white">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spotify-lightgray" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="pl-10 h-12 bg-spotify-base border-spotify-highlight text-spotify-white placeholder:text-spotify-lightgray"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-spotify-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spotify-lightgray" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="pl-10 h-12 bg-spotify-base border-spotify-highlight text-spotify-white placeholder:text-spotify-lightgray"
                  />
                </div>
              </div>

              {activeTab === 'login' && (
                <div className="text-right">
                  <button type="button" className="text-sm text-spotify-green hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button 
                type="submit"
                className="w-full h-12 bg-spotify-green hover:bg-spotify-green/80 text-black font-medium"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  activeTab === 'login' ? 'Login' : 'Register'
                )}
              </Button>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-spotify-highlight" />
                <span className="mx-3 text-xs text-spotify-lightgray">or login with</span>
                <div className="flex-grow border-t border-spotify-highlight" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-transparent border-spotify-highlight text-spotify-white hover:bg-spotify-highlight"
                onClick={handleSignInWithGoogle}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
                    <g>
                      <path fill="#4285F4" d="M21.805 10.023h-9.766v3.953h5.672c-.246 1.196-.997 2.21-2.01 2.885v2.383h3.244c1.902-1.752 2.861-4.338 2.861-7.074 0-.481-.04-.956-.122-1.423z"/>
                      <path fill="#34A853" d="M12.039 21.653c2.611 0 4.805-.87 6.406-2.352l-3.244-2.383c-.898.607-2.047.963-3.162.963-2.429 0-4.487-1.64-5.227-3.832h-3.291v2.407c1.594 3.148 4.916 5.197 8.518 5.197z"/>
                      <path fill="#FBBC05" d="M6.812 14.349A5.195 5.195 0 0 1 6.225 12c0-.819.147-1.615.406-2.349V7.244h-3.29A9.414 9.414 0 0 0 2.04 12c0 1.484.357 2.891.989 4.117l3.283-2.407z"/>
                      <path fill="#EA4335" d="M12.039 6.987c1.427 0 2.704.492 3.71 1.457l2.773-2.774C16.84 3.939 14.65 3 12.039 3c-3.602 0-6.924 2.049-8.518 5.197l3.291 2.407c.74-2.192 2.798-3.834 5.227-3.834z"/>
                    </g>
                  </svg>
                )}
                Google
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-base via-black to-spotify-elevated flex items-center justify-center p-6">
      <div className="w-full max-w-6xl mx-auto">
        <Card className="overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl">
          <div className="flex min-h-[600px]">
            {/* Left Panel - Welcome Section */}
            <div className={`relative overflow-hidden transition-all duration-700 ease-in-out ${
              activeTab === 'login' 
                ? 'w-3/5 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700' 
                : 'w-2/5 bg-gradient-to-br from-spotify-green via-green-500 to-emerald-600'
            }`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-12 text-white">
                <div className={`transform transition-all duration-700 ${
                  activeTab === 'login' ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                }`}>
                  {activeTab === 'login' && (
                    <>
                      <h1 className="text-5xl font-bold mb-6">Hello, Welcome!</h1>
                      <p className="text-xl mb-8 opacity-90">Don't have an account?</p>
                      <Button
                        onClick={() => setActiveTab('register')}
                        variant="outline"
                        className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-medium transition-all duration-300"
                      >
                        Register
                      </Button>
                    </>
                  )}
                </div>
                <div className={`transform transition-all duration-700 ${
                  activeTab === 'register' ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
                }`}>
                  {activeTab === 'register' && (
                    <>
                      <h1 className="text-5xl font-bold mb-6">Welcome Back!</h1>
                      <p className="text-xl mb-8 opacity-90">Already have an account?</p>
                      <Button
                        onClick={() => setActiveTab('login')}
                        variant="outline"
                        className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-green-600 px-8 py-3 text-lg font-medium transition-all duration-300"
                      >
                        Login
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Form Section */}
            <div className={`transition-all duration-700 ease-in-out ${
              activeTab === 'login' ? 'w-2/5' : 'w-3/5'
            } bg-white flex items-center justify-center p-12`}>
              <div className="w-full max-w-md">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-gray-800 mb-2">
                    {activeTab === 'login' ? 'Login' : 'Register'}
                  </h2>
                  <p className="text-gray-600">Welcome to Sonic Wave</p>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={activeTab === 'login' ? handleEmailSignIn : handleEmailSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading || googleLoading}
                        className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading || googleLoading}
                        className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {activeTab === 'login' && (
                    <div className="text-right">
                      <button type="button" className="text-sm text-blue-600 hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button 
                    type="submit"
                    className={`w-full h-12 font-medium text-white transition-all duration-300 ${
                      activeTab === 'login' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      activeTab === 'login' ? 'Login' : 'Register'
                    )}
                  </Button>

                  <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300" />
                    <span className="mx-4 text-sm text-gray-500">or login with</span>
                    <div className="flex-grow border-t border-gray-300" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50 transition-all duration-300"
                    onClick={handleSignInWithGoogle}
                    disabled={googleLoading || loading}
                  >
                    {googleLoading ? (
                      <Loader2 className="animate-spin h-5 w-5 mr-3" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3" aria-hidden="true">
                        <g>
                          <path fill="#4285F4" d="M21.805 10.023h-9.766v3.953h5.672c-.246 1.196-.997 2.21-2.01 2.885v2.383h3.244c1.902-1.752 2.861-4.338 2.861-7.074 0-.481-.04-.956-.122-1.423z"/>
                          <path fill="#34A853" d="M12.039 21.653c2.611 0 4.805-.87 6.406-2.352l-3.244-2.383c-.898.607-2.047.963-3.162.963-2.429 0-4.487-1.64-5.227-3.832h-3.291v2.407c1.594 3.148 4.916 5.197 8.518 5.197z"/>
                          <path fill="#FBBC05" d="M6.812 14.349A5.195 5.195 0 0 1 6.225 12c0-.819.147-1.615.406-2.349V7.244h-3.29A9.414 9.414 0 0 0 2.04 12c0 1.484.357 2.891.989 4.117l3.283-2.407z"/>
                          <path fill="#EA4335" d="M12.039 6.987c1.427 0 2.704.492 3.71 1.457l2.773-2.774C16.84 3.939 14.65 3 12.039 3c-3.602 0-6.924 2.049-8.518 5.197l3.291 2.407c.74-2.192 2.798-3.834 5.227-3.834z"/>
                        </g>
                      </svg>
                    )}
                    Google
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
