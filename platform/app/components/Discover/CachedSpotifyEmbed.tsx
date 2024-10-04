import React, { useState, useEffect } from 'react';

interface CachedSpotifyEmbedProps {
  trackId: string;
  isVisible: boolean;
  onLoad: () => void;
}

const iframeCache: { [key: string]: boolean } = {};

export const CachedSpotifyEmbed: React.FC<CachedSpotifyEmbedProps> = ({ trackId, isVisible, onLoad }) => {
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    if (!iframeCache[trackId]) {
      iframeCache[trackId] = true;
    }

    setShowIframe(true);

    return () => {
      setShowIframe(false);
    };
  }, [trackId, isVisible]);

  const handleIframeLoad = () => {
    onLoad();
  };

  if (!showIframe) return null;

  return (
    <iframe
      src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
      width="100%"
      height="152"
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      onLoad={handleIframeLoad}
      title="Spotify Embed"
    />
  );
};