
import React, { useEffect, useState } from "react";
import CardGrid from "@/components/CardGrid";
import { getAllArtists, Artist } from "@/services/supabaseService";

const Artists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      try {
        // Assumes you have a getAllArtists function in supabaseService
        const result = await getAllArtists();
        setArtists(result || []);
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  // Transform artists to CardGrid cards
  const cards = artists.map((artist) => ({
    id: artist.id,
    name: artist.name,
    description: artist.bio || "",
    imageUrl: artist.image || "https://api.napster.com/imageserver/images/v2/default/artist/170x170.png",
    type: "artist" as const,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 pt-8 pb-24">
      <CardGrid title="Top Artists" cards={cards} cols={5} />
      {loading && <div className="text-center text-gray-400 mt-8">Loading...</div>}
      {!loading && cards.length === 0 && (
        <div className="text-center text-gray-400 mt-8">No artists found.</div>
      )}
    </div>
  );
};

export default Artists;
