import { useEffect, useState, useRef, useMemo } from 'react';
import { Tooltip } from '../Tooltip';
import { Playlist, PlaylistTracksResponse } from '../../types/playlists/types';
import { CachedSpotifyEmbed } from './CachedSpotifyEmbed';
import { useInView } from 'react-intersection-observer';
import { useLocalStorage } from '../../hooks/useLocalStorage'; 

interface SpotifyEmbedProps {
  uri: string;
  selectedPlaylist: Playlist | null;
  playlistTracks: PlaylistTracksResponse | null;
  removeTrackFromPlaylist: (playlistId: string, trackUri: string) => void;
}

const TrackActions: React.FC<{ 
  uri: string; 
  selectedPlaylist: Playlist | null;
  playlistTracks: PlaylistTracksResponse | null;
  removeTrackFromPlaylist: (playlistId: string, trackUri: string) => void;
}> = ({ uri, selectedPlaylist, playlistTracks, removeTrackFromPlaylist }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const existingPlaylistButtonRef = useRef<HTMLButtonElement>(null);
  const newPlaylistButtonRef = useRef<HTMLButtonElement>(null);

  const isTrackInPlaylist = useMemo(() => {
    if (!playlistTracks || !Array.isArray(playlistTracks)) return false;
    
    // Extract the track ID from the uri
    const trackId = uri.split(':').pop();
    
    return playlistTracks.some(track => {
      // Compare with both uri and id
      return track.uri === uri || track.uri.endsWith(`:${trackId}`);
    });
  }, [playlistTracks, uri]);

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
  };

  const handleAddToExistingPlaylist = async () => {
    if (isTrackInPlaylist && selectedPlaylist) {
      setIsRemoving(true);
      try {
        await removeTrackFromPlaylist(selectedPlaylist.id, uri);
      } catch (error) {
        console.error('Failed to remove track from playlist:', error);
      } finally {
        setIsRemoving(false);
      }
    } else {
      console.log(`Add to existing playlist: ${uri}`);
    }
  };

  const handleAddToNewPlaylist = () => {
    console.log(`Add to new playlist: ${uri}`);
  };

  const showTooltip = (tooltipId: string) => {
    setActiveTooltip(tooltipId);
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  return (
    <div className="absolute bottom-2 right-12 flex space-x-2 transition-opacity duration-300">
      <button
        ref={likeButtonRef}
        onClick={handleLikeToggle}
        onMouseEnter={() => showTooltip('like')}
        onMouseLeave={hideTooltip}
        className={`w-8 h-8 flex items-center justify-center rounded-full ${
          isLiked 
            ? 'bg-pink-500 text-white' 
            : 'bg-pink-400 text-pink-500'
        } hover:bg-pink-600 hover:text-white transition-colors shadow-md hover:shadow-lg`}
      >
        {isLiked ? '❤️' : '🤍'}
      </button>
      {activeTooltip === 'like' && likeButtonRef.current && (
        <Tooltip 
          text={isLiked ? "Remove from liked tracks" : "Add to liked tracks"} 
          targetRect={likeButtonRef.current.getBoundingClientRect()} 
          position="top"
        />
      )}

      <button
        ref={existingPlaylistButtonRef}
        onClick={handleAddToExistingPlaylist}
        onMouseEnter={() => showTooltip('existing')}
        onMouseLeave={hideTooltip}
        disabled={isRemoving}
        className={`w-8 h-8 flex items-center justify-center rounded-full ${
          isTrackInPlaylist
            ? 'bg-green-500 text-white'
            : 'bg-gradient-to-r from-pink-400 to-orange-400 text-white'
        } hover:from-pink-500 hover:to-orange-500 transition-colors shadow-md hover:shadow-lg ${
          isRemoving ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isRemoving ? '⏳' : isTrackInPlaylist ? '✓' : '📁'}
      </button>
      {activeTooltip === 'existing' && existingPlaylistButtonRef.current && (
        <Tooltip 
          text={isTrackInPlaylist ? `Remove from ${selectedPlaylist?.name}` : `Add to ${selectedPlaylist?.name}`} 
          targetRect={existingPlaylistButtonRef.current.getBoundingClientRect()} 
          position="top"
        />
      )}

      <button
        ref={newPlaylistButtonRef}
        onClick={handleAddToNewPlaylist}
        onMouseEnter={() => showTooltip('new')}
        onMouseLeave={hideTooltip}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-400 text-white hover:bg-orange-500 transition-colors shadow-md hover:shadow-lg"
      >
        ➕
      </button>
      {activeTooltip === 'new' && newPlaylistButtonRef.current && (
        <Tooltip 
          text="Add to new playlist" 
          targetRect={newPlaylistButtonRef.current.getBoundingClientRect()} 
          position="top"
        />
      )}
    </div>
  );
};

const useTrackCache = () => {
  const [loadedTracks, setLoadedTracks] = useLocalStorage<string[]>('loadedTracks', []);

  const addTrack = (trackId: string) => {
    setLoadedTracks(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      if (!prevArray.includes(trackId)) {
        return [...prevArray, trackId];
      }
      return prevArray;
    });
  };

  const hasTrack = (trackId: string) => {
    return Array.isArray(loadedTracks) && loadedTracks.includes(trackId);
  };

  return { addTrack, hasTrack };
};

export function SpotifyEmbed({ uri, selectedPlaylist, playlistTracks, removeTrackFromPlaylist }: SpotifyEmbedProps) {
  const [trackId, setTrackId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { addTrack, hasTrack } = useTrackCache();

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
          addTrack(trackId);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '100px',
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
  }, [trackId, addTrack]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (error || !trackId) {
    return null;
  }

  return (
    <div ref={ref} className="h-[152px] w-full relative">
      {(isVisible || hasTrack(trackId)) && (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
              <p className="text-gray-600 font-semibold">Unearthing find...</p>
            </div>
          )}
          <TrackActions 
            uri={uri} 
            selectedPlaylist={selectedPlaylist}
            playlistTracks={playlistTracks}
            removeTrackFromPlaylist={removeTrackFromPlaylist}
          />
          <CachedSpotifyEmbed trackId={trackId} isVisible={isVisible} onLoad={handleIframeLoad} />
        </>
      )}
    </div>
  );
}
