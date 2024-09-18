import { useEffect, useState, useRef } from 'react';

interface SpotifyEmbedProps {
  uri: string;
}

// Simple cache to store loaded tracks
const loadedTracks = new Set<string>();

export function SpotifyEmbed({ uri }: SpotifyEmbedProps) {
  const [trackId, setTrackId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parts = uri.split(':');
    if (parts.length === 3 && parts[1] === 'track') {
      setTrackId(parts[2]);
    } else {
      setError('Invalid Spotify URI');
    }
  }, [uri]);

  useEffect(() => {
    if (!trackId) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          loadedTracks.add(trackId);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '100px', // Start loading when within 100px of viewport
        threshold: 0.1
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [trackId]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsLoading(false), 1000); // Simulate loading time
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (error) {
    return null;
  }

  if (!trackId) {
    return null;
  }

  return (
    <div ref={ref} className="h-[152px] w-full relative">
      {(isVisible || loadedTracks.has(trackId)) && (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
              <p className="text-gray-600 font-semibold">Unearthing find...</p>
            </div>
          )}
          <iframe 
            style={{ borderRadius: '12px', opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s' }}
            src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`} 
            width="100%" 
            height="152" 
            frameBorder="0" 
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
            title="Spotify Embed"
          />
        </>
      )}
    </div>
  );
}
