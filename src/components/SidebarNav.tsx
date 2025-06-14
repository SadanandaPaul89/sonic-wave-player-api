import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Library, Plus, Upload, BadgeCheck, LogOut, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isUserAdmin, setUserAsAdmin } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const SidebarNav: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication and admin status when component mounts
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        try {
          const adminStatus = await isUserAdmin(session.user.id);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    checkAdminStatus();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        try {
          const adminStatus = await isUserAdmin(session.user.id);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else if (event === 'SIGNED_OUT') {
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "You need to be logged in to become an admin.",
          variant: "destructive",
        });
        return;
      }
      
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
    } catch (error) {
      console.error('Error setting admin status:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
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
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-spotify-highlight text-white' : 'text-gray-400 hover:text-white'}`
          }
        >
          <Info className="mr-3 h-5 w-5" />
          About Us
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
