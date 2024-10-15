import { useState, useCallback, useEffect, useRef } from "react";
import { useFetcher } from "@remix-run/react";
import { Playlist } from "../types/playlists/types";

interface PlaylistsResponse {
  href: string;
  items: Playlist[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

interface PlaylistTracksResponse {
  href: string;
  items: Array<{ track: any }>;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export const usePlaylists = () => {
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] =
    useState<PlaylistTracksResponse | null>(null);
  const [totalPlaylists, setTotalPlaylists] = useState<number>(0);
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const fetcher = useFetcher();
  const shouldLoadPlaylists = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const [gridSelectedPlaylist, setGridSelectedPlaylist] = useState<Playlist | null>(null);
  const [gridSelectedPlaylistTracks, setGridSelectedPlaylistTracks] = useState<PlaylistTracksResponse | null>(null);

  const loadPlaylists = useCallback(
    async (forcedOffset?: number) => {
      if (shouldLoadPlaylists.current && !isLoading) {
        setIsLoading(true);
        const currentOffset =
          forcedOffset !== undefined ? forcedOffset : offset;
        const url = `/api/playlists?limit=${limit}&offset=${currentOffset}`;
        try {
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();

          if ("items" in data) {
            setSavedPlaylists(data.items);
            setTotalPlaylists(data.total);
            setHasMore(!!data.next);
            setOffset(currentOffset);
          }
        } catch (error) {
          console.error("Error fetching playlists:", error);
        } finally {
          setIsLoading(false);
          shouldLoadPlaylists.current = false;
        }
      }
    },
    [limit, offset, isLoading]
  );

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setOffset((prevOffset) => {
        const newOffset = prevOffset + limit;
        shouldLoadPlaylists.current = true;
        loadPlaylists(newOffset);
        return newOffset;
      });
    }
  }, [hasMore, limit, isLoading, loadPlaylists]);

  const loadPrevious = useCallback(() => {
    if (offset > 0 && !isLoading) {
      const newOffset = Math.max(0, offset - limit);
      shouldLoadPlaylists.current = true;
      setOffset(newOffset);
      loadPlaylists(newOffset);
    }
  }, [offset, limit, isLoading, loadPlaylists]);

  useEffect(() => {
    if (shouldLoadPlaylists.current) {
      loadPlaylists();
    }
  }, [loadPlaylists]);

  useEffect(() => {
    if (shouldLoadPlaylists.current) {
      loadPlaylists();
    }
  }, [loadPlaylists, offset]);

  const selectPlaylist = useCallback(
    async (playlistId: string) => {
      const playlist = savedPlaylists.find((p) => p.id === playlistId);
      if (playlist) {
        setSelectedPlaylist(playlist);
      }

      setIsLoading(true);
      try {
        // Fetch playlist details
        const detailsResponse = await fetch(`/api/playlists?playlistId=${playlistId}`);
        const detailsData = await detailsResponse.json();

        if (detailsData.id) {
          setSelectedPlaylist(detailsData);
        }

        // Fetch playlist tracks
        const tracksResponse = await fetch(`/api/playlists?playlistId=${playlistId}&tracks=true`);
        const tracksData = await tracksResponse.json();

        if (tracksData.items && Array.isArray(tracksData.items)) {
          setSelectedPlaylistTracks(tracksData);
        }
      } catch (error) {
        console.error("Error fetching playlist details and tracks:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [savedPlaylists]
  );

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setOffset(0);
    setHasMore(true);
    shouldLoadPlaylists.current = true;
  }, []);

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      fetcher.submit(
        {
          action: "delete",
          playlistData: JSON.stringify({ id: playlistId }),
        },
        { method: "post", action: "/api/playlists" }
      );
    },
    [fetcher]
  );

  const loadPage = useCallback(
    (page: number) => {
      const newOffset = (page - 1) * limit;
      setOffset(newOffset);
      shouldLoadPlaylists.current = true;
      loadPlaylists(newOffset);
    },
    [limit, loadPlaylists]
  );

  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, trackUri: string) => {
      try {
        const formData = new FormData();
        formData.append("action", "remove_items");
        formData.append(
          "playlistData",
          JSON.stringify({
            id: playlistId,
            tracks: [{ uri: trackUri }],
          })
        );

        const response = await fetch("/api/playlists", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (selectedPlaylist && selectedPlaylist.id === playlistId) {
          setSelectedPlaylistTracks((prevTracks) => {
            if (prevTracks) {
              return {
                ...prevTracks,
                items: prevTracks.items.filter(
                  (item) => item.track.uri !== trackUri
                ),
              };
            }
            return prevTracks;
          });
        }

        return result;
      } catch (error) {
        console.error("Error removing track from playlist:", error);
        throw error;
      }
    },
    [selectedPlaylist]
  );

  const updatePlaylistTracks = useCallback(
    (playlistId: string, newTracks: any[]) => {
      setSelectedPlaylistTracks((prevTracks) => {
        if (prevTracks && prevTracks.items) {
          return {
            ...prevTracks,
            items: newTracks.map((track) => ({ track })),
          };
        }
        return prevTracks;
      });
    },
    []
  );

  const clearSelectedPlaylist = useCallback(() => {
    setSelectedPlaylist(null);
    setSelectedPlaylistTracks(null);
  }, []);

  const selectGridPlaylist = useCallback(async (playlistId: string) => {
    const playlist = savedPlaylists.find((p) => p.id === playlistId);
    if (playlist) {
      setGridSelectedPlaylist(playlist);
      try {
        const response = await fetch(
          `/api/playlists?playlistId=${playlistId}&tracks=true`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setGridSelectedPlaylistTracks(data);
      } catch (error) {
        console.error('Error fetching grid playlist tracks:', error);
      }
    }
  }, [savedPlaylists]);

  return {
    savedPlaylists,
    selectedPlaylist,
    selectedPlaylistTracks,
    totalPlaylists,
    limit,
    offset,
    hasMore,
    loadPlaylists,
    loadMore,
    loadPrevious,
    selectPlaylist,
    changeLimit,
    isLoadingPlaylists: isLoading,
    isLoadingSelectedPlaylist:
      fetcher.state !== "idle" &&
      fetcher.data &&
      "items" in fetcher.data &&
      fetcher.data.items[0] &&
      "track" in fetcher.data.items[0],
    playlistsError: fetcher.data?.error,
    deletePlaylist,
    isDeletingPlaylist:
      fetcher.state === "submitting" &&
      fetcher.submission?.formData.get("action") === "delete",
    currentPage: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(totalPlaylists / limit),
    loadPage,
    removeTrackFromPlaylist,
    updatePlaylistTracks,
    clearSelectedPlaylist,
    selectGridPlaylist,
    gridSelectedPlaylist,
    gridSelectedPlaylistTracks,
  };
};
