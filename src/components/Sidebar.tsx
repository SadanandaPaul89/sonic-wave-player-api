import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, Library, PlusSquare, Heart, Music, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
      toast.success('Successfully signed out!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <aside className="w-64 bg-black p-6 flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-6">Sonic Wave</h1>
        <nav className="space-y-4">
          <Link to="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
            <Home className="mr-3" size={24} />
            <span className="font-medium">Home</span>
          </Link>
          <Link to="/search" className="flex items-center text-gray-300 hover:text-white transition-colors">
            <Search className="mr-3" size={24} />
            <span className="font-medium">Search</span>
          </Link>
          <Link to="/library" className="flex items-center text-gray-300 hover:text-white transition-colors">
            <Library className="mr-3" size={24} />
            <span className="font-medium">Your Library</span>
          </Link>
        </nav>
      </div>
      
      <div className="mt-6">
        <Link to="/publish" className="flex items-center text-gray-300 hover:text-white transition-colors mb-4">
          <Music className="mr-3" size={24} />
          <span className="font-medium">Publish Song</span>
        </Link>
        <button className="flex items-center text-gray-300 hover:text-white transition-colors mb-4">
          <PlusSquare className="mr-3" size={24} />
          <span className="font-medium">Create Playlist</span>
        </button>
        <button className="flex items-center text-gray-300 hover:text-white transition-colors">
          <Heart className="mr-3" size={24} />
          <span className="font-medium">Liked Songs</span>
        </button>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 mb-3">PLAYLISTS</div>
        <ul className="space-y-2">
          <li><a href="#" className="text-gray-300 hover:text-white transition-colors">My Playlist #1</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Chill Vibes</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Workout Mix</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Road Trip</a></li>
        </ul>
      </div>
      
      <div className="mt-auto pt-6 border-t border-gray-800">
        <button 
          onClick={handleSignOut}
          className="flex items-center text-gray-300 hover:text-white transition-colors w-full"
        >
          <LogOut className="mr-3" size={24} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
