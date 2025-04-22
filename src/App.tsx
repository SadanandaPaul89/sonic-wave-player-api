
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
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
            <Route path="/" element={session ? <Layout><Home /></Layout> : <Navigate to="/auth" />} />
            <Route path="/search" element={session ? <Layout><Search /></Layout> : <Navigate to="/auth" />} />
            <Route path="/library" element={session ? <Layout><Library /></Layout> : <Navigate to="/auth" />} />
            <Route path="/album/:id" element={session ? <Layout><AlbumView /></Layout> : <Navigate to="/auth" />} />
            <Route path="/artist/:id" element={session ? <Layout><ArtistView /></Layout> : <Navigate to="/auth" />} />
            <Route path="/artist-profile/:id" element={session ? <Layout><ArtistProfile /></Layout> : <Navigate to="/auth" />} />
            <Route path="/publish" element={session ? <Layout><PublishSong /></Layout> : <Navigate to="/auth" />} />
            <Route path="/artist-registration" element={session ? <Layout><ArtistRegistration /></Layout> : <Navigate to="/auth" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
