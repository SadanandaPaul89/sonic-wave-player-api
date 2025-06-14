
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
    <BrowserRouter>
      <Routes>
        {/* Share route - no layout needed for better sharing experience */}
        <Route path="/share/:trackId" element={<ShareTrack />} />
        
        {/* Main app routes with layout */}
        <Route path="/" element={
          <Layout>
            <Index />
          </Layout>
        } />
        <Route path="/search" element={
          <Layout>
            <Search />
          </Layout>
        } />
        <Route path="/library" element={
          <Layout>
            <Library />
          </Layout>
        } />
        <Route path="/artist/:artistId" element={
          <Layout>
            <ArtistProfile />
          </Layout>
        } />
        <Route path="/album/:albumId" element={
          <Layout>
            <AlbumView />
          </Layout>
        } />
        <Route path="/publish" element={
          <Layout>
            <PublishSong />
          </Layout>
        } />
        <Route path="/artist-registration" element={
          <Layout>
            <ArtistRegistration />
          </Layout>
        } />
        <Route path="/auth" element={
          <Layout>
            <Auth />
          </Layout>
        } />
        <Route path="/admin" element={
          <Layout>
            <AdminPanel />
          </Layout>
        } />
        <Route path="*" element={
          <Layout>
            <NotFound />
          </Layout>
        } />
      </Routes>
      <Toaster />
      <SonnerToaster />
    </BrowserRouter>
  );
}

export default App;
