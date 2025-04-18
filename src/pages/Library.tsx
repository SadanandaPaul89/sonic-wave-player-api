
import React from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Library: React.FC = () => {
  return (
    <div className="pb-20">
      <h1 className="text-3xl font-bold mb-6">Your Library</h1>
      
      <Tabs defaultValue="playlists" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
        </TabsList>
        
        <TabsContent value="playlists" className="mt-0">
          <div className="bg-spotify-elevated rounded-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Create your first playlist</h2>
            <p className="text-gray-400 mb-6">It's easy, we'll help you</p>
            <button className="bg-white text-black font-medium py-3 px-8 rounded-full hover:scale-105 transition-transform">
              Create playlist
            </button>
          </div>
        </TabsContent>
        
        <TabsContent value="artists" className="mt-0">
          <div className="bg-spotify-elevated rounded-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Follow your first artist</h2>
            <p className="text-gray-400 mb-6">Follow artists you like by tapping the follow button</p>
            <Link to="/search" className="bg-white text-black font-medium py-3 px-8 rounded-full hover:scale-105 transition-transform inline-block">
              Find artists
            </Link>
          </div>
        </TabsContent>
        
        <TabsContent value="albums" className="mt-0">
          <div className="bg-spotify-elevated rounded-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Save your first album</h2>
            <p className="text-gray-400 mb-6">Save albums you like by tapping the heart icon</p>
            <Link to="/search" className="bg-white text-black font-medium py-3 px-8 rounded-full hover:scale-105 transition-transform inline-block">
              Find albums
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;
