import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getAuthService, isUsingLocalAuth } from '@/config/auth';
import { Loader2, AlertCircle, Lock, Mail, Eye, EyeOff, CheckCircle, X } from 'lucide-react';
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
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setError(null);
    setEmail('');
    setPassword('');
    setValidationErrors({});
    setIsEmailValid(false);
    setIsPasswordValid(false);
    setShowSuccess(false);
  }, [activeTab]);

  // Real-time validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  useEffect(() => {
    setIsPasswordValid(password.length >= 6);
  }, [password]);

  const validateInputs = () => {
    const errors: { [key: string]: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!isEmailValid) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors below');
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
      console.log('Attempting to sign in with:', email, '(Local auth:', isUsingLocalAuth(), ')');
      const authService = await getAuthService();
      console.log('Auth service loaded:', authService);

      const { data, error } = await authService.signInWithPassword({
        email,
        password,
      });

      console.log('Auth response:', { data, error });

      if (error) throw error;

      console.log('Sign in successful:', data);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
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
      console.log('Attempting to sign up with:', email, '(Local auth:', isUsingLocalAuth(), ')');
      const authService = await getAuthService();
      console.log('Auth service loaded:', authService);

      const { data, error } = await authService.signUp({
        email,
        password,
      });

      console.log('Auth response:', { data, error });

      if (error) throw error;

      console.log('Sign up successful:', data);

      if (isUsingLocalAuth()) {
        toast.success('Account created successfully!');
        if (data?.session) {
          setShowSuccess(true);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        }
      } else {
        // Supabase specific logic
        if (data?.user && 'identities' in data.user && data.user.identities?.length === 0) {
          toast.info('Please check your email for confirmation link');
        } else {
          toast.success('Account created successfully!');
        }

        if (data?.session) {
          setShowSuccess(true);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        }
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
      console.log('Attempting Google sign in (Local auth:', isUsingLocalAuth(), ')');
      const authService = await getAuthService();

      if (isUsingLocalAuth()) {
        // For local auth, simulate Google OAuth
        const { error } = await authService.signInWithOAuth({
          provider: 'google',
        });

        if (error) {
          setError(error.message || 'Could not sign in with Google');
          toast.error(error.message || 'Could not sign in with Google');
        } else {
          toast.success('Signed in with Google successfully!');
          navigate('/', { replace: true });
        }
      } else {
        // Supabase OAuth
        const { error } = await authService.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + "/",
          },
        });

        if (error) {
          setError(error.message || 'Could not sign in with Google');
          toast.error(error.message || 'Could not sign in with Google');
        }
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
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '6s' }}></div>
            </div>

            {/* Light overlay for better contrast */}
            <div className="absolute inset-0 bg-white/10"></div>
        </div>

        <div>
          <Card className="w-full max-w-sm bg-white/95 backdrop-blur-lg shadow-2xl border border-white/20 relative z-10">
              <CardContent className="p-6">
                <div className="text-center mb-8">
                  <div className="relative h-16">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      {activeTab === 'login' ? 'Login' : 'Register'}
                    </h2>
                  </div>
                  <div className="relative h-6">
                    <p className="text-gray-600">
                      Welcome to Sonic Wave
                    </p>
                  </div>
                  {isUsingLocalAuth() && (
                    <div className="mt-4 px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                      <p className="text-blue-800 text-sm font-medium">
                        🔧 Development Mode: Using Local Authentication
                      </p>
                      <div className="mt-2 text-xs text-blue-700">
                        <p><strong>Quick Test Login:</strong></p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEmail('test@example.com');
                              setPassword('password123');
                            }}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                          >
                            Test User
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmail('admin@example.com');
                              setPassword('admin123');
                            }}
                            className="px-2 py-1 bg-purple-600 text-white text-xs rounded"
                          >
                            Admin
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmail('artist@example.com');
                              setPassword('artist123');
                            }}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                          >
                            Artist
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-blue-600">Or use any email + password (6+ chars)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tab Navigation - Fixed contrast */}
                <div className="flex mb-6 bg-white/90 rounded-lg p-1 border border-gray-300">
                  <button
                    onClick={() => setActiveTab('login')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${activeTab === 'login'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-800 bg-white/70'
                      }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${activeTab === 'register'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-800 bg-white/70'
                      }`}
                  >
                    Register
                  </button>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {showSuccess && (
                  <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {activeTab === 'login' ? 'Login successful! Redirecting...' : 'Account created successfully! Redirecting...'}
                    </AlertDescription>
                  </Alert>
                )}



                <form onSubmit={activeTab === 'login' ? handleEmailSignIn : handleEmailSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${validationErrors.email ? 'text-red-400' :
                        isEmailValid && email ? 'text-green-500' :
                          'text-gray-400'
                        }`} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading || googleLoading}
                        className={`pl-10 pr-10 h-12 ${validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                          isEmailValid && email ? 'border-green-300 focus:border-green-500 focus:ring-green-500' :
                            'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                      />
                      {email && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isEmailValid ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${validationErrors.password ? 'text-red-400' :
                        isPasswordValid && password ? 'text-green-500' :
                          'text-gray-400'
                        }`} />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading || googleLoading}
                        className={`pl-10 pr-20 h-12 ${validationErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                          isPasswordValid && password ? 'border-green-300 focus:border-green-500 focus:ring-green-500' :
                            'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {password && (
                          <div>
                            {isPasswordValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-500 text-sm">
                        {validationErrors.password}
                      </p>
                    )}
                    {password && !validationErrors.password && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                          <span className={`${password.length >= 6 ? 'text-green-600' : 'text-gray-500'
                            }`}>
                            At least 6 characters
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {activeTab === 'login' && (
                    <div className="text-right">
                      <button type="button" className="text-sm text-blue-600 underline font-medium">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className={`w-full h-12 font-medium text-white shadow-lg ${activeTab === 'login'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                      : 'bg-gradient-to-r from-green-600 to-green-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={loading || googleLoading || !isEmailValid || !isPasswordValid}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4" />
                        {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                      </div>
                    ) : (
                      <span>
                        {activeTab === 'login' ? 'Login' : 'Register'}
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-400" />
                    <span className="mx-4 text-sm text-gray-500">or continue with</span>
                    <div className="flex-grow border-t border-gray-400" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-gray-300 bg-gray-50"
                    onClick={handleSignInWithGoogle}
                    disabled={googleLoading || loading}
                  >
                    {googleLoading ? (
                      <Loader2 className="h-5 w-5 mr-3" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3" aria-hidden="true">
                        <g>
                          <path fill="#4285F4" d="M21.805 10.023h-9.766v3.953h5.672c-.246 1.196-.997 2.10-2.01 2.885v2.383h3.244c1.902-1.752 2.861-4.338 2.861-7.074 0-.481-.04-.956-.122-1.423z" />
                          <path fill="#34A853" d="M12.039 21.653c2.611 0 4.805-.87 6.406-2.352l-3.244-2.383c-.898.607-2.047.963-3.162.963-2.429 0-4.487-1.64-5.227-3.832h-3.291v2.407c1.594 3.148 4.916 5.197 8.518 5.197z" />
                          <path fill="#FBBC05" d="M6.812 14.349A5.195 5.195 0 0 1 6.225 12c0-.819.147-1.615.406-2.349V7.244h-3.29A9.414 9.414 0 0 0 2.04 12c0 1.484.357 2.891.989 4.117l3.283-2.407z" />
                          <path fill="#EA4335" d="M12.039 6.987c1.427 0 2.704.492 3.71 1.457l2.773-2.774C16.84 3.939 14.65 3 12.039 3c-3.602 0-6.924 2.049-8.518 5.197l3.291 2.407c.74-2.192 2.798-3.834 5.227-3.834z" />
                        </g>
                      </svg>
                    )}
                    {activeTab === 'login' ? 'Login with Google' : 'Register with Google'}
                  </Button>
              </form>
            </CardContent>
          </Card>
        </div>
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
            <div className="absolute top-0 right-0 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '6s' }}></div>
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
        <div>
            <Card className="overflow-hidden bg-white/80 backdrop-blur-lg shadow-2xl border border-white/20">
              <div className="flex min-h-[600px]">
                {/* Left Panel - Welcome Section with Enhanced Background */}
                <div className={`relative overflow-hidden ${activeTab === 'login'
                  ? 'w-3/5'
                  : 'w-2/5'
                  }`}>
                  {/* Animated Background Layers */}
                  <div className={`absolute inset-0 ${activeTab === 'login'
                    ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800'
                    : 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700'
                    }`}>
                    {/* Floating Orbs */}
                    <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-xl opacity-30 animate-pulse ${activeTab === 'login' ? 'bg-blue-300' : 'bg-emerald-300'
                      }`}></div>
                    <div className={`absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full blur-xl opacity-20 animate-pulse ${activeTab === 'login' ? 'bg-indigo-300' : 'bg-teal-300'
                      }`} style={{ animationDelay: '1s' }}></div>
                    <div className={`absolute top-1/2 right-1/3 w-16 h-16 rounded-full blur-lg opacity-25 animate-pulse ${activeTab === 'login' ? 'bg-blue-200' : 'bg-green-200'
                      }`} style={{ animationDelay: '2s' }}></div>

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
                      <div className={`absolute inset-0 flex flex-col justify-center items-center ${activeTab === 'login'
                        ? 'block'
                        : 'hidden'
                        }`}>
                        <div className="space-y-8">
                          <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                            Welcome Back!
                          </h1>
                          <p className="text-xl font-light">
                            Don't have an account?
                          </p>
                          <Button
                            onClick={() => setActiveTab('register')}
                            variant="outline"
                            className="border-2 border-white/80 text-white bg-transparent px-8 py-3 text-lg font-medium backdrop-blur-sm"
                          >
                            Register
                          </Button>
                        </div>
                      </div>

                      {/* Register Content */}
                      <div className={`absolute inset-0 flex flex-col justify-center items-center ${activeTab === 'register'
                        ? 'block'
                        : 'hidden'
                        }`}>
                        <div className="space-y-8">
                          <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                            Join Sonic Wave!
                          </h1>
                          <p className="text-xl font-light">
                            Already have an account?
                          </p>
                          <Button
                            onClick={() => setActiveTab('login')}
                            variant="outline"
                            className="border-2 border-white/80 text-white bg-transparent px-8 py-3 text-lg font-medium backdrop-blur-sm"
                          >
                            Login
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Form Section */}
                <div className={`${activeTab === 'login' ? 'w-2/5' : 'w-3/5'
                  } bg-white flex items-center justify-center p-8`}>
                  <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                      <div className="relative h-16">
                        <h2 className="text-4xl font-bold text-gray-800 mb-2">
                          {activeTab === 'login' ? 'Login' : 'Register'}
                        </h2>
                      </div>
                      <div className="relative h-6">
                        <p className="text-gray-600">
                          {activeTab === 'login' ? 'Welcome Back' : 'Welcome to Sonic Wave'}
                        </p>
                      </div>
                      {isUsingLocalAuth() && (
                        <div className="mt-4 px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                          <p className="text-blue-800 text-sm font-medium">
                            🔧 Development Mode: Using Local Authentication
                          </p>
                          <div className="mt-2 text-xs text-blue-700">
                            <p><strong>Quick Test Login:</strong></p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setEmail('test@example.com');
                                  setPassword('password123');
                                }}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                              >
                                Test User
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEmail('admin@example.com');
                                  setPassword('admin123');
                                }}
                                className="px-2 py-1 bg-purple-600 text-white text-xs rounded"
                              >
                                Admin
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEmail('artist@example.com');
                                  setPassword('artist123');
                                }}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                              >
                                Artist
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-blue-600">Or use any email + password (6+ chars)</p>
                          </div>
                        </div>
                      )}
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
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading || googleLoading}
                            className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {activeTab === 'login' && (
                        <div className="text-right">
                          <button type="button" className="text-sm text-blue-600 underline font-medium">
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className={`w-full h-12 font-medium text-white ${activeTab === 'login'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                          : 'bg-gradient-to-r from-green-600 to-green-700'
                          }`}
                        disabled={loading || googleLoading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4" />
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
                        className="w-full h-12 border-gray-300 bg-gray-50"
                        onClick={handleSignInWithGoogle}
                        disabled={googleLoading || loading}
                      >
                        {googleLoading ? (
                          <Loader2 className="h-5 w-5 mr-3" />
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3" aria-hidden="true">
                            <g>
                              <path fill="#4285F4" d="M21.805 10.023h-9.766v3.953h5.672c-.246 1.196-.997 2.10-2.01 2.885v2.383h3.244c1.902-1.752 2.861-4.338 2.861-7.074 0-.481-.04-.956-.122-1.423z" />
                              <path fill="#34A853" d="M12.039 21.653c2.611 0 4.805-.87 6.406-2.352l-3.244-2.383c-.898.607-2.047.963-3.162.963-2.429 0-4.487-1.64-5.227-3.832h-3.291v2.407c1.594 3.148 4.916 5.197 8.518 5.197z" />
                              <path fill="#FBBC05" d="M6.812 14.349A5.195 5.195 0 0 1 6.225 12c0-.819.147-1.615.406-2.349V7.244h-3.29A9.414 9.414 0 0 0 2.04 12c0 1.484.357 2.891.989 4.117l3.283-2.407z" />
                              <path fill="#EA4335" d="M12.039 6.987c1.427 0 2.704.492 3.71 1.457l2.773-2.774C16.84 3.939 14.65 3 12.039 3c-3.602 0-6.924 2.049-8.518 5.197l3.291 2.407c.74-2.192 2.798-3.834 5.227-3.834z" />
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
    </div>
  );
};

export default Auth;
