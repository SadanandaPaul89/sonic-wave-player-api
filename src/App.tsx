
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Index from './pages/Index';
import Search from './pages/Search';
import Library from './pages/Library';
import ArtistProfile from './pages/ArtistProfile';
import AlbumView from './pages/AlbumView';
import PublishSong from './pages/PublishSong';
import ArtistRegistration from './pages/ArtistRegistration';
import Auth from './pages/Auth';
import AdminPanel from './pages/AdminPanel';
import ShareTrack from './pages/ShareTrack';
import NotFound from './pages/NotFound';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

function App() {
  return (
    <>
      <Routes>
        {/* Share route - no layout needed for better sharing experience */}
        <Route path="/share/:trackId" element={<ShareTrack />} />
        
        {/* Main app routes with layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/artist/:artistId" element={<ArtistProfile />} />
              <Route path="/album/:albumId" element={<AlbumView />} />
              <Route path="/publish" element={<PublishSong />} />
              <Route path="/artist-registration" element={<ArtistRegistration />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        } />
      </Routes>
      <Toaster />
      <SonnerToaster />
    </>
  );
}

export default App;
