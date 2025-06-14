
import React, { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

// We expect to receive artistId and artistName
interface ArtistNameWithBadgeProps {
  artistId: string;
  artistName: string;
  className?: string;
  linkToProfile?: boolean; // optional: if true, wrap with Link to artist profile
  plain?: boolean; // if true, do not use additional styling (for inline uses)
}

// Simple in-memory cache for verified artist ids
const verifiedArtistCache: { [artistId: string]: boolean } = {};

const ArtistNameWithBadge: React.FC<ArtistNameWithBadgeProps> = ({
  artistId,
  artistName,
  className = "",
  linkToProfile = false,
  plain = false,
}) => {
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function fetchVerification() {
      if (artistId in verifiedArtistCache) {
        if (mounted) setIsVerified(verifiedArtistCache[artistId]);
        return;
      }
      const { data, error } = await supabase
        .from("artists")
        .select("verification_status")
        .eq("id", artistId)
        .single();
      if (!error && data?.verification_status === "verified") {
        verifiedArtistCache[artistId] = true;
        if (mounted) setIsVerified(true);
      } else {
        verifiedArtistCache[artistId] = false;
        if (mounted) setIsVerified(false);
      }
    }
    if (artistId) fetchVerification();
    return () => { mounted = false };
  }, [artistId]);

  // Optionally wrap in link if requested
  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) =>
    linkToProfile
      ? (
        <a
          href={`/artist/${artistId}`}
          className={`${plain ? "" : "hover:underline"} ${className}`}
          aria-label={`Go to artist: ${artistName}`}
        >
          {children}
        </a>
      )
      : (
        <span className={className}>{children}</span>
      );

  return (
    <Wrapper>
      <span className={`inline-flex items-center gap-1 ${plain ? "" : "font-medium"}`}>
        <span>{artistName}</span>
        {isVerified && (
          <BadgeCheck className="inline-block text-blue-500 ml-1 h-4 w-4" aria-label="Verified artist" />
        )}
      </span>
    </Wrapper>
  );
};

export default ArtistNameWithBadge;

