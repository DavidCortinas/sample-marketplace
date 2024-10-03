import { useEffect, useState, useRef } from 'react';

interface SpotifyEmbedProps {
  uri: string;
}

const TrackActions: React.FC<{ uri: string }> = ({ uri }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
    console.log(`${isLiked ? 'Unliked' : 'Liked'} track: ${uri}`);
  };

  const handleAddToExistingPlaylist = () => {
    console.log(`Add to existing playlist: ${uri}`);
  };

  const handleAddToNewPlaylist = () => {
    console.log(`Add to new playlist: ${uri}`);
  };

  return (
    <div className="absolute bottom-2 right-12 flex space-x-2 transition-opacity duration-300">
      <button
        onClick={handleLikeToggle}
        className={`w-8 h-8 flex items-center justify-center rounded-full ${
          isLiked 
            ? 'bg-pink-500 text-white' 
            : 'bg-pink-400 text-pink-500'
        } hover:bg-pink-600 hover:text-white transition-colors shadow-md hover:shadow-lg`}
      >
        {isLiked ? '❤️' : '🤍'}
      </button>
      <button
        onClick={handleAddToExistingPlaylist}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-400 to-orange-400 text-white hover:from-pink-500 hover:to-orange-500 transition-colors shadow-md hover:shadow-lg"
      >
        📁
      </button>
      <button
        onClick={handleAddToNewPlaylist}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-400 text-white hover:bg-orange-500 transition-colors shadow-md hover:shadow-lg"
      >
        ➕
      </button>
    </div>
  );
};

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
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
              <p className="text-gray-600 font-semibold">Unearthing find...</p>
            </div>
          ) : (
            <TrackActions uri={uri} />
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
          ></iframe>
        </>
      )}
    </div>
  );
}
