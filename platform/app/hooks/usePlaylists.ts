import { useState, useCallback, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import { Playlist } from '../types/playlists/types'; // Assuming you have a Playlist type defined

export const usePlaylists = () => {
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const fetcher = useFetcher();

  const loadPlaylists = useCallback(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load('/api/playlists');
    }
  }, [fetcher]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    if (fetcher.data && !fetcher.data.error) {
      setSavedPlaylists(fetcher.data);
    }
  }, [fetcher.data]);

  const saveNewPlaylist = useCallback(
    (playlistData: Omit<Playlist, 'id'>) => {
      const formData = new FormData();
      formData.append('playlistData', JSON.stringify(playlistData));
      fetcher.submit(formData, {
        method: 'post',
        action: '/api/playlists',
      });
    },
    [fetcher]
  );

  const selectPlaylist = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
  }, []);

  const updatePlaylist = useCallback(
    (playlistId: string, updatedData: Partial<Playlist>) => {
      const formData = new FormData();
      formData.append('playlistData', JSON.stringify(updatedData));
      fetcher.submit(formData, {
        method: 'put',
        action: `/api/playlists/${playlistId}`,
      });
    },
    [fetcher]
  );

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      fetcher.submit(null, {
        method: 'delete',
        action: `/api/playlists/${playlistId}`,
      });
    },
    [fetcher]
  );

  return {
    savedPlaylists,
    loadPlaylists,
    saveNewPlaylist,
    selectPlaylist,
    selectedPlaylist,
    updatePlaylist,
    deletePlaylist,
    isLoading: fetcher.state !== 'idle',
    error: fetcher.data?.error,
  };
};
