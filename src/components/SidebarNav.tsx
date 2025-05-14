
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Library, Plus, Upload, BadgeCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isUserAdmin, setUserAsAdmin } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const SidebarNav: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        const adminStatus = await isUserAdmin(session.user.id);
        setIsAdmin(adminStatus);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true);
        const adminStatus = await isUserAdmin(session.user.id);
        setIsAdmin(adminStatus);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMakeAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const result = await setUserAsAdmin(session.user.id);
      if (result) {
        setIsAdmin(true);
        toast({
          title: "Success",
          description: "You are now an admin.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to set admin status.",
          variant: "destructive",
        });
      }
    }
  };

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
      
      {isAuthenticated && (
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

          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-500 hover:bg-red-900 hover:text-white w-full text-left"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>

          {!isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMakeAdmin}
              className="text-xs text-gray-400 hover:text-white w-full mt-2"
            >
              Become Admin
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default SidebarNav;
