import { UserData } from "./user";
import type { SpotifyCredentials } from "../hooks/useSpotify";
import { Playlists } from "./playlists/types";
import { Query } from "./recommendations/types";

export type OutletContext = {
  user: UserData | null;
  queries: Query[] | null;
  playlists: Playlists | null;
  spotifyCredentials: SpotifyCredentials | null;
  accessToken: string | null;
  refreshSpotifyToken: () => Promise<SpotifyCredentials>;
}