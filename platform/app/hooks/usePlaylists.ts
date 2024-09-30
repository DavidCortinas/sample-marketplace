import { useState, useCallback, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { Playlist } from "../types/playlists/types";

export const usePlaylists = () => {
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcher = useFetcher();
  console.log("fetcher", fetcher);
  console.log("fetcher.data", fetcher.data);
  console.log("savedPlaylists", savedPlaylists);

  const loadPlaylists = useCallback(() => {
    console.log("Loading playlists");
    if (isInitialLoad || savedPlaylists.length === 0) {
      setIsLoadingPlaylists(true);
      fetcher.load("/api/playlists");
    }
  }, [fetcher, isInitialLoad, savedPlaylists.length]);

  const selectPlaylist = useCallback((playlistId: string) => {
    const playlist = savedPlaylists.items.find(p => p.id === playlistId);
    setSelectedPlaylist(playlist || null);
  }, [savedPlaylists]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      console.log("fetcher.data", fetcher.data);
      setIsLoadingPlaylists(false);
      setIsInitialLoad(false);
      if (fetcher.data.error) {
        setError(fetcher.data.error);
      } else {
        setSavedPlaylists(fetcher.data);
        setError(null);
      }
    }
  }, [fetcher.state, fetcher.data]);

  return {
    savedPlaylists,
    selectedPlaylist,
    isLoadingPlaylists,
    error,
    loadPlaylists,
    selectPlaylist,
  };
};
