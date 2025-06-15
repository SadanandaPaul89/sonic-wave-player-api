
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Profile = {
  id: string;
  username: string;
  name: string | null;
  username_changes: number;
};

const MAX_USERNAME_CHANGES = 2;

const ProfileForm = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [usernameChanges, setUsernameChanges] = useState(0);
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
        setUsernameChanges(data.username_changes || 0);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Save updated profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!username) {
      toast({ title: "Username is required." });
      return;
    }
    if (username !== profile.username && usernameChanges >= MAX_USERNAME_CHANGES) {
      toast({ title: "You have reached the limit for username changes." });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSaving(false);
      toast({ title: "Not signed in", description: "Please log in again." });
      return;
    }
    // If username is changing, increment username_changes
    let updates: Partial<Profile> & { updated_at: string } = {
      username,
      name,
      updated_at: new Date().toISOString(),
    };
    if (username !== profile.username) {
      updates.username_changes = usernameChanges + 1;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id);
    if (error) {
      toast({ title: "Update failed", description: error.message });
    } else {
      toast({ title: "Profile updated" });
      setProfile(prev => prev ? { ...prev, ...updates } as Profile : null);
      setUsernameChanges(
        username !== profile.username ? usernameChanges + 1 : usernameChanges
      );
    }
    setSaving(false);
  };

  const canChangeUsername = usernameChanges < MAX_USERNAME_CHANGES;

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
                disabled={!canChangeUsername}
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info size={16} />
                <span>
                  {canChangeUsername
                    ? `You can change your username ${MAX_USERNAME_CHANGES - usernameChanges} more time${MAX_USERNAME_CHANGES - usernameChanges === 1 ? "" : "s"}.`
                    : "You have used all your username changes."}
                </span>
              </div>
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
