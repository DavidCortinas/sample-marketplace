import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { Tooltip } from '../Tooltip';
import { Playlist, Playlists } from '../../types/playlists/types';
import { getRandomColor } from '../../utils/forms';
import { usePlaylists } from '~/hooks/usePlaylists';

export function PlaylistsForm() {
  const { 
  savedPlaylists, 
  loadPlaylists, 
  saveNewPlaylist, 
  selectPlaylist,
  selectedPlaylist,
  updatePlaylist,
  deletePlaylist,
  isLoading, 
  error 
} = usePlaylists();
  console.log(savedPlaylists);

  const [hoveredPlaylistId, setHoveredPlaylistId] = useState<string | null>(null);
  const navigate = useNavigate();
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const colorRefs = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    // Generate colors for each playlist once when the component mounts
    savedPlaylists.items.forEach((playlist) => {
      if (!colorRefs.current[playlist.id]) {
        colorRefs.current[playlist.id] = getRandomColor();
      }
    });
  }, [savedPlaylists]);

  const handleSelectPlaylist = (playlist: Playlist) => {
    // Implement playlist selection logic here
    console.log('Selected playlist:', playlist);
  };


  if (!savedPlaylists || savedPlaylists.items.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg text-center font-semibold">Playlists</h2>
        <p className="text-center text-text-secondary mt-4">{"You don't have any playlists yet"}.</p>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/create-playlist')}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Create a Playlist
          </button>
        </div>
      </div>
    );
  }
  console.log(savedPlaylists);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-lg text-center font-semibold mb-4">Your Playlists</h2>
      <div className="flex flex-col space-y-2">
        {savedPlaylists.items.map((playlist) => (
          <div 
            key={playlist.id} 
            className="relative"
            onMouseEnter={() => setHoveredPlaylistId(playlist.id)}
            onMouseLeave={() => setHoveredPlaylistId(null)}
          >
            <button 
              ref={(el) => buttonRefs.current[playlist.id] = el}
              className={`w-full px-4 py-2 rounded-full text-sm text-white text-center font-medium transition-colors ${colorRefs.current[playlist.id]} text-left`}
              onClick={() => handleSelectPlaylist(playlist)}
            >
              <span className="truncate block">{playlist.name}</span>
            </button>
            {hoveredPlaylistId === playlist.id && (
              <Tooltip 
                text="View playlist details"
                targetRect={buttonRefs.current[playlist.id]?.getBoundingClientRect() || null}
                position="right"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}