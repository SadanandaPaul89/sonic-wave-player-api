
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Profile = {
  id: string;
  username: string;
  name: string;
};

const ProfileForm = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        toast({ title: "Not signed in", description: "Please log in first." });
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) {
        toast({ title: "Failed to load profile", description: error.message });
      }
      if (data) {
        setProfile(data);
        setUsername(data.username || "");
        setName(data.name || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Save updated profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast({ title: "Username is required." });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSaving(false);
      toast({ title: "Not signed in", description: "Please log in again." });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ username, name, updated_at: new Date().toISOString() })
      .eq("id", session.user.id);
    if (error) {
      toast({ title: "Update failed", description: error.message });
    } else {
      toast({ title: "Profile updated" });
    }
    setSaving(false);
  };

  return (
    <Card className="max-w-md mx-auto my-6 bg-spotify-elevated">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="off"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="bg-background"
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
