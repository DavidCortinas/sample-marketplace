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
  console.log("selectedPlaylist", selectedPlaylist);
  console.log("selectedPlaylistTracks", selectedPlaylistTracks);
  console.log("savedPlaylists", savedPlaylists);

  const loadPlaylists = useCallback(
    async (forcedOffset?: number) => {
      console.log("Loading playlists", { limit, offset: forcedOffset });
      console.log("shouldLoadPlaylists.current", shouldLoadPlaylists.current);
      console.log("isLoading", isLoading);
      if (shouldLoadPlaylists.current && !isLoading) {
        setIsLoading(true);
        const currentOffset =
          forcedOffset !== undefined ? forcedOffset : offset;
        console.log("Loading playlists", { limit, offset: currentOffset });
        const url = `/api/playlists?limit=${limit}&offset=${currentOffset}`;
        try {
          const response = await fetch(url);
          console.log("Fetch response status:", response.status);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Fetched data:", data);

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
    console.log("Loading more playlists");
    if (hasMore && !isLoading) {
      setOffset((prevOffset) => {
        const newOffset = prevOffset + limit;
        console.log("New offset:", newOffset);
        shouldLoadPlaylists.current = true;
        loadPlaylists(newOffset);
        return newOffset;
      });
    }
  }, [hasMore, limit, isLoading, loadPlaylists]);

  const loadPrevious = useCallback(() => {
    console.log("Loading previous playlists");
    if (offset > 0 && !isLoading) {
      console.log("Loading previous playlists", { offset, limit });
      const newOffset = Math.max(0, offset - limit);
      console.log("New offset:", newOffset);
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
    (playlistId: string) => {
      const playlist = savedPlaylists.find((p) => p.id === playlistId);
      if (playlist) {
        setSelectedPlaylist(playlist);
      }
      console.log(`Fetching playlist details for ID: ${playlistId}`);
      // Fetch playlist details
      fetcher.load(`/api/playlists?playlistId=${playlistId}`);
      // Fetch playlist tracks
      fetcher.load(`/api/playlists?playlistId=${playlistId}&tracks=true`);
    },
    [fetcher, savedPlaylists]
  );

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setOffset(0);
    // Don't clear savedPlaylists here
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

  useEffect(() => {
    console.log("Fetcher data changed:", fetcher.data);
    if (fetcher.data && !fetcher.data.error) {
      if (fetcher.data.message === "Playlist successfully unfollowed") {
        // ... existing code for playlist deletion ...
      } else if (fetcher.data.items && Array.isArray(fetcher.data.items)) {
        // This is the tracks data
        console.log("Received tracks data:", fetcher.data);
        setSelectedPlaylistTracks(fetcher.data);
      } else if (fetcher.data.id) {
        // This is the playlist data (without tracks)
        console.log("Received playlist data:", fetcher.data);
        setSelectedPlaylist(fetcher.data);
      } else {
        console.log("Unexpected fetcher data structure:", fetcher.data);
      }
    }
  }, [fetcher.data]);

  // Add this effect to log changes to selectedPlaylist and selectedPlaylistTracks
  useEffect(() => {
    console.log("selectedPlaylist updated:", selectedPlaylist);
    console.log("selectedPlaylistTracks updated:", selectedPlaylistTracks);
  }, [selectedPlaylist, selectedPlaylistTracks]);

  const loadPage = useCallback((page: number) => {
    console.log(`Loading page ${page}`);
    const newOffset = (page - 1) * limit;
    setOffset(newOffset);
    shouldLoadPlaylists.current = true;
    loadPlaylists(newOffset);
  }, [limit, loadPlaylists]);

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
  };
};
