
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
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
import NotFound from "./pages/NotFound";
import { toast } from "sonner";

const queryClient = new QueryClient();

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          return;
        }
        console.log("Initial session check:", data.session ? "Session found" : "No session");
        setSession(data.session);
      } catch (error) {
        console.error("Error in auth initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("Auth state changed:", event, currentSession ? "Session exists" : "No session");
      
      // Update state based on the authentication event
      if (event === 'SIGNED_IN' && currentSession) {
        setSession(currentSession);
        toast.success("Successfully signed in!");
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        toast.success("Successfully signed out!");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" replace />} />
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
            <Route path="/album/:id" element={session ? <Layout><AlbumView /></Layout> : <Navigate to="/auth" replace />} />
            <Route path="/artist/:id" element={session ? <Layout><ArtistView /></Layout> : <Navigate to="/auth" replace />} />
            <Route path="/artist-profile/:id" element={session ? <Layout><ArtistProfile /></Layout> : <Navigate to="/auth" replace />} />
            <Route path="/publish" element={session ? <Layout><PublishSong /></Layout> : <Navigate to="/auth" replace />} />
            <Route path="/artist-registration" element={session ? <Layout><ArtistRegistration /></Layout> : <Navigate to="/auth" replace />} />
            <Route path="/admin" element={session ? <Layout><AdminPanel /></Layout> : <Navigate to="/auth" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
