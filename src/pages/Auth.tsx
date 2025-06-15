
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {/* Enhanced Background with Bright Gradient - Mobile */}
        <div className="absolute inset-0">
          {/* Bright gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-300"></div>
          
          {/* Animated mesh gradient overlay */}
          <div className="absolute inset-0 opacity-70">
            <div className="absolute top-0 left-0 w-48 h-48 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '6s'}}></div>
          </div>
          
          {/* Light overlay for better contrast */}
          <div className="absolute inset-0 bg-white/10"></div>
        </div>

        <Card className="w-full max-w-sm bg-white/95 backdrop-blur-lg shadow-2xl border border-white/20 relative z-10">
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <div className="relative h-16 overflow-hidden">
                <h2 className={`absolute inset-0 text-3xl font-bold text-gray-900 mb-2 transition-all duration-700 transform ${
                  activeTab === 'login' ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
                }`}>
                  Login
                </h2>
                <h2 className={`absolute inset-0 text-3xl font-bold text-gray-900 mb-2 transition-all duration-700 transform ${
                  activeTab === 'register' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                  Register
                </h2>
              </div>
              <p className="text-gray-700 transition-all duration-500">Welcome to Sonic Wave</p>
            </div>

            {/* Tab Navigation - Fixed contrast */}
            <div className="flex mb-6 bg-white/90 rounded-lg p-1 border border-gray-300">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 text-sm font-medium ${
                  activeTab === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-800 hover:text-gray-900 hover:bg-white/70'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 text-sm font-medium ${
                  activeTab === 'register'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-800 hover:text-gray-900 hover:bg-white/70'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={activeTab === 'login' ? handleEmailSignIn : handleEmailSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="pl-10 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 hover:border-gray-400 focus:shadow-lg text-gray-900"
                  />
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100"></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="pl-10 pr-10 h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 hover:border-gray-400 focus:shadow-lg text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-all duration-300 hover:scale-110"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100"></div>
                </div>
              </div>

              {activeTab === 'login' && (
                <div className="text-right">
                  <button type="button" className="text-sm text-blue-600 hover:underline font-medium transition-all duration-300 hover:text-blue-700">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button 
                type="submit"
                className={`w-full h-12 font-medium text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                  activeTab === 'login' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
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
                <div className="flex-grow border-t border-gray-400" />
                <span className="mx-4 text-sm text-gray-700">or continue with</span>
                <div className="flex-grow border-t border-gray-400" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white border-gray-300 hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md hover:border-gray-400 text-gray-700"
                onClick={handleSignInWithGoogle}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-3" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3" aria-hidden="true">
                    <g>
                      <path fill="#4285F4" d="M21.805 10.023h-9.766v3.953h5.672c-.246 1.196-.997 2.10-2.01 2.885v2.383h3.244c1.902-1.752 2.861-4.338 2.861-7.074 0-.481-.04-.956-.122-1.423z"/>
                      <path fill="#34A853" d="M12.039 21.653c2.611 0 4.805-.87 6.406-2.352l-3.244-2.383c-.898.607-2.047.963-3.162.963-2.429 0-4.487-1.64-5.227-3.832h-3.291v2.407c1.594 3.148 4.916 5.197 8.518 5.197z"/>
                      <path fill="#FBBC05" d="M6.812 14.349A5.195 5.195 0 0 1 6.225 12c0-.819.147-1.615.406-2.349V7.244h-3.29A9.414 9.414 0 0 0 2.04 12c0 1.484.357 2.891.989 4.117l3.283-2.407z"/>
                      <path fill="#EA4335" d="M12.039 6.987c1.427 0 2.704.492 3.71 1.457l2.773-2.774C16.84 3.939 14.65 3 12.039 3c-3.602 0-6.924 2.049-8.518 5.197l3.291 2.407c.74-2.192 2.798-3.834 5.227-3.834z"/>
                    </g>
                  </svg>
                )}
                {activeTab === 'login' ? 'Login with Google' : 'Register with Google'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* Enhanced Background with Bright Gradient */}
      <div className="absolute inset-0">
        {/* Bright gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-300"></div>
        
        {/* Animated mesh gradient overlay */}
        <div className="absolute inset-0 opacity-70">
          <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '6s'}}></div>
        </div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.3) 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        
        {/* Light overlay for better contrast */}
        <div className="absolute inset-0 bg-white/10"></div>
      </div>
      
      <div className="w-full max-w-4xl mx-auto relative z-10">
        <Card className="overflow-hidden bg-white/80 backdrop-blur-lg shadow-2xl border border-white/20">
          <div className="flex min-h-[600px]">
            {/* Left Panel - Welcome Section with Enhanced Background */}
            <div className={`relative overflow-hidden transition-all duration-1000 ease-in-out ${
              activeTab === 'login' 
                ? 'w-3/5' 
                : 'w-2/5'
            }`}>
              {/* Animated Background Layers */}
              <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                activeTab === 'login'
                  ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800'
                  : 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700'
              }`}>
                {/* Floating Orbs */}
                <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-xl opacity-30 transition-all duration-1000 ${
                  activeTab === 'login' ? 'bg-blue-300' : 'bg-emerald-300'
                } animate-pulse`}></div>
                <div className={`absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full blur-xl opacity-20 transition-all duration-1000 ${
                  activeTab === 'login' ? 'bg-indigo-300' : 'bg-teal-300'
                } animate-pulse`} style={{animationDelay: '1s'}}></div>
                <div className={`absolute top-1/2 right-1/3 w-16 h-16 rounded-full blur-lg opacity-25 transition-all duration-1000 ${
                  activeTab === 'login' ? 'bg-blue-200' : 'bg-green-200'
                } animate-pulse`} style={{animationDelay: '2s'}}></div>
                
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20"></div>
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-12 text-white">
                <div className="relative w-full max-w-md">
                  {/* Login Content */}
                  <div className={`absolute inset-0 flex flex-col justify-center items-center transition-all duration-700 ease-out transform ${
                    activeTab === 'login' 
                      ? 'translate-x-0 opacity-100 scale-100' 
                      : 'translate-x-12 opacity-0 scale-95'
                  }`}>
                    <div className="space-y-8">
                      <h1 className="text-6xl font-bold transition-all duration-700 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                        Hello, Welcome!
                      </h1>
                      <p className="text-xl opacity-90 transition-all duration-700 font-light">
                        Don't have an account?
                      </p>
                      <Button
                        onClick={() => setActiveTab('register')}
                        variant="outline"
                        className="border-2 border-white/80 text-white bg-transparent hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-medium transition-all duration-500 transform hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
                      >
                        Register
                      </Button>
                    </div>
                  </div>
                  
                  {/* Register Content */}
                  <div className={`absolute inset-0 flex flex-col justify-center items-center transition-all duration-700 ease-out transform ${
                    activeTab === 'register' 
                      ? 'translate-x-0 opacity-100 scale-100' 
                      : '-translate-x-12 opacity-0 scale-95'
                  }`}>
                    <div className="space-y-8">
                      <h1 className="text-6xl font-bold transition-all duration-700 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                        Welcome Back!
                      </h1>
                      <p className="text-xl opacity-90 transition-all duration-700 font-light">
                        Already have an account?
                      </p>
                      <Button
                        onClick={() => setActiveTab('login')}
                        variant="outline"
                        className="border-2 border-white/80 text-white bg-transparent hover:bg-white hover:text-emerald-600 px-8 py-3 text-lg font-medium transition-all duration-500 transform hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
                      >
                        Login
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Form Section */}
            <div className={`transition-all duration-1000 ease-in-out ${
              activeTab === 'login' ? 'w-2/5' : 'w-3/5'
            } bg-white flex items-center justify-center p-8`}>
              <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                  <div className="relative h-16 overflow-hidden">
                    <h2 className={`absolute inset-0 text-4xl font-bold text-gray-800 mb-2 transition-all duration-700 transform ${
                      activeTab === 'login' ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
                    }`}>
                      Login
                    </h2>
                    <h2 className={`absolute inset-0 text-4xl font-bold text-gray-800 mb-2 transition-all duration-700 transform ${
                      activeTab === 'register' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}>
                      Register
                    </h2>
                  </div>
                  <p className="text-gray-600 transition-all duration-500">Welcome to Sonic Wave</p>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-6 animate-fade-in">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={activeTab === 'login' ? handleEmailSignIn : handleEmailSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading || googleLoading}
                        className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 hover:border-gray-400 focus:shadow-lg"
                      />
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading || googleLoading}
                        className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 hover:border-gray-400 focus:shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100"></div>
                    </div>
                  </div>

                  {activeTab === 'login' && (
                    <div className="text-right">
                      <button type="button" className="text-sm text-blue-600 hover:underline font-medium transition-all duration-300 hover:text-blue-700">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button 
                    type="submit"
                    className={`w-full h-12 font-medium text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                      activeTab === 'login' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
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
                    <span className="mx-4 text-sm text-gray-500">or continue with</span>
                    <div className="flex-grow border-t border-gray-300" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md hover:border-gray-400"
                    onClick={handleSignInWithGoogle}
                    disabled={googleLoading || loading}
                  >
                    {googleLoading ? (
                      <Loader2 className="animate-spin h-5 w-5 mr-3" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3" aria-hidden="true">
                        <g>
                          <path fill="#4285F4" d="M21.805 10.023h-9.766v3.953h5.672c-.246 1.196-.997 2.10-2.01 2.885v2.383h3.244c1.902-1.752 2.861-4.338 2.861-7.074 0-.481-.04-.956-.122-1.423z"/>
                          <path fill="#34A853" d="M12.039 21.653c2.611 0 4.805-.87 6.406-2.352l-3.244-2.383c-.898.607-2.047.963-3.162.963-2.429 0-4.487-1.64-5.227-3.832h-3.291v2.407c1.594 3.148 4.916 5.197 8.518 5.197z"/>
                          <path fill="#FBBC05" d="M6.812 14.349A5.195 5.195 0 0 1 6.225 12c0-.819.147-1.615.406-2.349V7.244h-3.29A9.414 9.414 0 0 0 2.04 12c0 1.484.357 2.891.989 4.117l3.283-2.407z"/>
                          <path fill="#EA4335" d="M12.039 6.987c1.427 0 2.704.492 3.71 1.457l2.773-2.774C16.84 3.939 14.65 3 12.039 3c-3.602 0-6.924 2.049-8.518 5.197l3.291 2.407c.74-2.192 2.798-3.834 5.227-3.834z"/>
                        </g>
                      </svg>
                    )}
                    {activeTab === 'login' ? 'Login with Google' : 'Register with Google'}
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
