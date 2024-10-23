import { API_BASE_URL } from "../config";
import { Artist, Playlist, Track } from "../types/playlists/types";

export async function fetchPlaylists(accessToken: string | null) {
  console.log("Fetching playlists with access token:", accessToken);
  const data = await fetch(`${API_BASE_URL}/api/playlists/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
}

export const fetchPlaylistsWithTracks = async (
  userId: string,
  accessToken: string
): Promise<Playlist[]> => {
  // Fetch playlists
  const playlistsResponse = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const playlistsData = await playlistsResponse.json();

  // Fetch tracks for each playlist and map to our structure
  const playlistsWithTracks = await Promise.all(
    playlistsData.items.map(async (playlist: Playlist) => {
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const tracksData = await tracksResponse.json();

      return {
        id: playlist.id,
        name: playlist.name,
        tracks: tracksData.items.map((track: Track) => ({
          id: track.id,
          name: track.name,
          artists: track.artists.map((artist: Artist) => ({
            name: artist.name,
          })),
          album: {
            images: track.album.images,
          },
        })),
      };
    })
  );

  return playlistsWithTracks;
};
