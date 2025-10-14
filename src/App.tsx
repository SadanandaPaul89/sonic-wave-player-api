import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { getAuthService, isUsingLocalAuth } from "./config/auth";
import { ThemeProvider } from "./components/ThemeProvider";
import { PlayerProvider } from "./contexts/PlayerContext";
import { WalletProvider } from "./contexts/WalletContext";
import { YellowProvider } from "./providers/YellowProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Library from "./pages/Library";
import AlbumView from "./pages/AlbumView";
import ArtistView from "./pages/ArtistView";
import ArtistProfile from "./pages/ArtistProfile";
import PublishSong from "./pages/PublishSong";
import ArtistRegistration from "./pages/ArtistRegistration";
import AdminPanel from "./pages/AdminPanel";
import Auth from "./pages/Auth";
import "./services/pinataQuickTest"; // Make quickPinataTest available globally
import NotFound from "./pages/NotFound";
import ShareTrack from "./pages/ShareTrack";
import AboutUs from "./pages/AboutUs";
import Artists from "./pages/Artists";
import ProfilePage from "./pages/ProfilePage";
import Wallet from "./pages/Wallet";

import Leaderboard from "./pages/Leaderboard";
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleAuthChange = useCallback((event: string, currentSession: any) => {
    console.log("Auth state changed:", event, currentSession ? "Session exists" : "No session");

    if (event === 'SIGNED_IN' && currentSession) {
      setSession(currentSession);
      // Use setTimeout to avoid potential re-render cycles
      setTimeout(() => {
        toast({
          title: "Successfully signed in!",
          description: "Welcome to Sonic Wave",
        });
      }, 0);
    } else if (event === 'SIGNED_OUT') {
      setSession(null);
      // Use setTimeout to avoid potential re-render cycles
      setTimeout(() => {
        toast({
          title: "Successfully signed out!",
          description: "We hope to see you again soon",
        });
      }, 0);
    } else if (event === 'TOKEN_REFRESHED' && currentSession) {
      setSession(currentSession);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log("Starting auth initialization...");
        const authService = await getAuthService();
        console.log("Auth service obtained");
        const { data, error } = await authService.getSession();
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        console.log("Initial session check:", data.session ? "Session found" : "No session");
        console.log("Using local auth:", isUsingLocalAuth());
        setSession(data.session);
      } catch (error) {
        console.error("Error in auth initialization:", error);
        // Set session to null to show auth page instead of infinite loading
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    const setupAuthListener = async () => {
      const authService = await getAuthService();
      const {
        data: { subscription },
      } = authService.onAuthStateChange(handleAuthChange);

      return subscription;
    };

    let subscription: any;

    const init = async () => {
      subscription = await setupAuthListener();
      await initializeAuth();
    };

    init();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [handleAuthChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WalletProvider>
              <YellowProvider autoConnect={true} enableToasts={true}>
                <PlayerProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" replace />} />
                  <Route path="/share/:trackId" element={<ShareTrack />} />
                  <Route
                    path="/"
                    element={
                      session ? (
                        <Layout>
                          <Home />
                        </Layout>
                      ) : (
                        <Navigate to="/auth" replace />
                      )
                    }
                  />
                  <Route path="/search" element={session ? <Layout><Search /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/library" element={session ? <Layout><Library /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/about" element={session ? <Layout><AboutUs /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/album/:id" element={session ? <Layout><AlbumView /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/artist/:id" element={session ? <Layout><ArtistView /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/artist-profile/:id" element={session ? <Layout><ArtistProfile /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/publish" element={session ? <Layout><PublishSong /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/artist-registration" element={session ? <Layout><ArtistRegistration /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/admin" element={session ? <Layout><AdminPanel /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/artists" element={session ? <Layout><Artists /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="/profile" element={
                    session ? (
                      <Layout>
                        <ProfilePage />
                      </Layout>
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  } />
                  <Route path="/wallet" element={session ? <Layout><Wallet /></Layout> : <Navigate to="/auth" replace />} />

                  <Route path="/leaderboard" element={session ? <Layout><Leaderboard /></Layout> : <Navigate to="/auth" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              <Toaster />
                </PlayerProvider>
              </YellowProvider>
            </WalletProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
