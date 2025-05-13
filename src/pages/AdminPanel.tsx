
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVerificationRequests, approveArtist, rejectArtist, isUserAdmin } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface VerificationRequest {
  id: string;
  artist_id: string;
  email: string;
  reason: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  artist_name: string;
  artist_image: string;
}

const AdminPanel: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        const adminStatus = await isUserAdmin(session.user.id);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          toast.error("You don't have admin privileges");
          navigate('/');
          return;
        }

        loadVerificationRequests();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const loadVerificationRequests = async () => {
    setIsLoading(true);
    try {
      const requests = await getVerificationRequests();
      setRequests(requests);
    } catch (error) {
      console.error('Error loading verification requests:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string, artistId: string) => {
    try {
      await approveArtist(requestId, artistId);
      toast.success('Artist verified successfully');
      loadVerificationRequests();
    } catch (error) {
      console.error('Error approving artist:', error);
      toast.error('Failed to verify artist');
    }
  };

  const handleReject = async (requestId: string, artistId: string) => {
    try {
      await rejectArtist(requestId, artistId);
      toast.success('Artist verification rejected');
      loadVerificationRequests();
    } catch (error) {
      console.error('Error rejecting artist:', error);
      toast.error('Failed to reject verification');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Button onClick={loadVerificationRequests} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-400">Loading verification requests...</div>
          </div>
        ) : (
          <>
            <TabsContent value="pending">
              {renderRequestsList(
                requests.filter(req => req.status === 'pending'),
                handleApprove,
                handleReject
              )}
            </TabsContent>
            
            <TabsContent value="approved">
              {renderRequestsList(
                requests.filter(req => req.status === 'approved'),
                handleApprove,
                handleReject,
                true
              )}
            </TabsContent>
            
            <TabsContent value="rejected">
              {renderRequestsList(
                requests.filter(req => req.status === 'rejected'),
                handleApprove,
                handleReject,
                true
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

const renderRequestsList = (
  requests: VerificationRequest[],
  handleApprove: (id: string, artistId: string) => void,
  handleReject: (id: string, artistId: string) => void,
  readOnly = false
) => {
  if (requests.length === 0) {
    return (
      <div className="bg-spotify-elevated rounded-lg p-6 text-center">
        <p className="text-gray-400">No verification requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <div key={request.id} className="bg-spotify-elevated rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={request.artist_image || 'https://cdn.jamendo.com/default/default-artist_200.jpg'} 
                alt={request.artist_name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="text-xl font-semibold">{request.artist_name}</h3>
                <Badge className={
                  request.status === 'pending' ? 'bg-yellow-600' : 
                  request.status === 'approved' ? 'bg-green-600' : 
                  'bg-red-600'
                }>
                  {request.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">Submitted on {new Date(request.created_at).toLocaleDateString()}</p>
              <p className="text-sm text-gray-400">Contact: {request.email}</p>
              <div className="mt-3 p-3 bg-spotify-base rounded">
                <p className="text-sm">{request.reason}</p>
              </div>
            </div>
          </div>
          
          {!readOnly && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                onClick={() => handleReject(request.id, request.artist_id)}
              >
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                onClick={() => handleApprove(request.id, request.artist_id)}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminPanel;
