import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Sparkles, Music, Palette, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen">
      <Navbar isAuthenticated={!!user} onLogout={handleLogout} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.3,
          }}
        />
        <div className="absolute inset-0 z-0 gradient-hero opacity-60" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 animate-fade-in">
              <Sparkles className="w-8 h-8 text-accent animate-pulse" />
              <span className="text-lg font-semibold text-primary">
                AI-Powered Music Discovery
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text animate-fade-in">
              Your Pinterest Vibes,
              <br />
              Your Perfect Playlist
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in">
              Transform your visual inspiration into curated Spotify playlists. 
              Let AI decode your aesthetic and create the perfect soundtrack.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
                size="lg"
                className="gradient-primary text-white text-lg px-8 py-6 shadow-strong hover:shadow-medium transition-smooth"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {user ? "Go to Dashboard" : "Get Started Free"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-2 hover:bg-primary/5 transition-smooth"
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Simple. Creative. Magical.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Turn your visual inspiration into music in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 text-center shadow-medium hover:shadow-strong transition-smooth group">
              <div className="inline-flex p-6 rounded-2xl gradient-primary mb-6 group-hover:scale-110 transition-bounce">
                <Palette className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">1. Share Your Board</h3>
              <p className="text-muted-foreground">
                Paste the URL of your favorite Pinterest board - your aesthetic inspiration
              </p>
            </Card>

            <Card className="p-8 text-center shadow-medium hover:shadow-strong transition-smooth group">
              <div className="inline-flex p-6 rounded-2xl gradient-secondary mb-6 group-hover:scale-110 transition-bounce">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">2. AI Analyzes</h3>
              <p className="text-muted-foreground">
                Our AI decodes the mood, colors, and vibes from your visual collection
              </p>
            </Card>

            <Card className="p-8 text-center shadow-medium hover:shadow-strong transition-smooth group">
              <div className="inline-flex p-6 rounded-2xl gradient-primary mb-6 group-hover:scale-110 transition-bounce">
                <Music className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">3. Enjoy Music</h3>
              <p className="text-muted-foreground">
                Get a custom playlist that perfectly matches your aesthetic energy
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <Sparkles className="w-16 h-16 text-accent mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Turn Vibes into Music?
            </h2>
            <p className="text-xl text-white/90 mb-12">
              Join thousands creating personalized playlists from their Pinterest inspiration
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-white text-primary text-lg px-12 py-6 shadow-strong hover:scale-105 transition-bounce"
            >
              Start Creating Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© 2025 PinTunes. Transform your aesthetic into music.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
