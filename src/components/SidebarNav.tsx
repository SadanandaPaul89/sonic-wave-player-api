
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Plus, Upload, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isUserAdmin, setUserAsAdmin } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';

const SidebarNav: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const adminStatus = await isUserAdmin(session.user.id);
        setIsAdmin(adminStatus);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <nav className="space-y-6">
      <div className="space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-spotify-highlight text-white' : 'text-gray-400 hover:text-white'}`
          }
        >
          <Home className="mr-3 h-5 w-5" />
          Home
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-spotify-highlight text-white' : 'text-gray-400 hover:text-white'}`
          }
        >
          <Search className="mr-3 h-5 w-5" />
          Search
        </NavLink>
        <NavLink
          to="/library"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-spotify-highlight text-white' : 'text-gray-400 hover:text-white'}`
          }
        >
          <Library className="mr-3 h-5 w-5" />
          Your Library
        </NavLink>
      </div>
      
      <div className="space-y-1">
        <NavLink
          to="/publish"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-spotify-highlight text-white' : 'text-gray-400 hover:text-white'}`
          }
        >
          <Upload className="mr-3 h-5 w-5" />
          Publish Song
        </NavLink>
        <NavLink
          to="/artist-registration"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-spotify-highlight text-white' : 'text-gray-400 hover:text-white'}`
          }
        >
          <Plus className="mr-3 h-5 w-5" />
          Register as Artist
        </NavLink>
        
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-spotify-highlight text-white' : 'text-green-500 hover:bg-green-900'}`
            }
          >
            <BadgeCheck className="mr-3 h-5 w-5" />
            Admin Panel
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default SidebarNav;
