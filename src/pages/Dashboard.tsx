import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Sparkles, Music, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  pinterest_board_url: string | null;
  mood_analysis: any;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pinterestUrl, setPinterestUrl] = useState("");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadPlaylists(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadPlaylists = async (userId: string) => {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load playlists");
      return;
    }

    setPlaylists(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleGeneratePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pinterestUrl.trim()) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-playlist", {
        body: { pinterestUrl },
      });

      if (error) throw error;

      toast.success("✨ Playlist generated successfully!");
      setPinterestUrl("");
      loadPlaylists(user.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate playlist");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} onLogout={handleLogout} />

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Your Creative Studio
            </h1>
            <p className="text-lg text-muted-foreground">
              Transform your Pinterest boards into amazing playlists
            </p>
          </div>

          <Card className="p-8 mb-12 shadow-medium">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Generate New Playlist</h2>
            </div>

            <form onSubmit={handleGeneratePlaylist} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pinterest">Pinterest Board URL</Label>
                <Input
                  id="pinterest"
                  type="url"
                  placeholder="https://pinterest.com/username/board-name"
                  value={pinterestUrl}
                  onChange={(e) => setPinterestUrl(e.target.value)}
                  required
                  className="transition-smooth focus:shadow-soft"
                />
                <p className="text-sm text-muted-foreground">
                  Paste the URL of your Pinterest board to analyze its vibe
                </p>
              </div>

              <Button
                type="submit"
                disabled={generating}
                className="w-full gradient-primary text-white shadow-soft hover:shadow-medium transition-smooth"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Your Perfect Playlist...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Playlist
                  </>
                )}
              </Button>
            </form>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Music className="w-6 h-6 text-primary" />
              Your Playlists
            </h2>

            {playlists.length === 0 ? (
              <Card className="p-12 text-center shadow-soft">
                <div className="inline-flex p-6 rounded-full gradient-primary/10 mb-4">
                  <Music className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
                <p className="text-muted-foreground">
                  Create your first playlist by entering a Pinterest board URL above
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {playlists.map((playlist) => (
                  <Card
                    key={playlist.id}
                    className="p-6 shadow-soft hover:shadow-medium transition-smooth"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{playlist.name}</h3>
                        {playlist.description && (
                          <p className="text-muted-foreground mb-3">{playlist.description}</p>
                        )}
                        {playlist.pinterest_board_url && (
                          <a
                            href={playlist.pinterest_board_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View Pinterest Board →
                          </a>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(playlist.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
