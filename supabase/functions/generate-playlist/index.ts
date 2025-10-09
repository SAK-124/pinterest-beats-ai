import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { pinterestUrl } = await req.json();

    if (!pinterestUrl) {
      throw new Error("Pinterest URL is required");
    }

    // Call Lovable AI to analyze the Pinterest board and generate playlist suggestions
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a creative music curator that analyzes Pinterest boards and creates playlist recommendations. 
            Based on the Pinterest board URL, you should:
            1. Infer the mood, aesthetic, and vibe from the board name/URL
            2. Suggest 15-20 songs that match that aesthetic
            3. Create a creative playlist name and description
            
            Respond with a JSON object containing:
            {
              "playlistName": "Creative playlist name",
              "description": "Brief description of the playlist vibe",
              "songs": ["Song 1 - Artist", "Song 2 - Artist", ...],
              "mood": "Overall mood/aesthetic analysis"
            }`,
          },
          {
            role: "user",
            content: `Analyze this Pinterest board and create a matching playlist: ${pinterestUrl}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits depleted. Please contact support.");
      }
      throw new Error("Failed to generate playlist");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse the AI response
    let playlistData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        playlistData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid AI response format");
      }
    } catch {
      playlistData = {
        playlistName: "Your Aesthetic Playlist",
        description: "A curated playlist inspired by your Pinterest board",
        songs: [],
        mood: aiContent,
      };
    }

    // Save the playlist to the database
    const { data: playlist, error: dbError } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        name: playlistData.playlistName || "Your Aesthetic Playlist",
        description: `${playlistData.description}\n\nSuggested tracks:\n${playlistData.songs?.join("\n") || ""}`,
        pinterest_board_url: pinterestUrl,
        mood_analysis: {
          mood: playlistData.mood,
          songs: playlistData.songs || [],
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save playlist");
    }

    return new Response(JSON.stringify({ success: true, playlist }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
