import { User } from "./user";
import type { SpotifyCredentials } from "../hooks/useSpotify";

export type OutletContext = {
  user: User | null;
  spotifyCredentials: SpotifyCredentials | null;
  refreshSpotifyToken: () => Promise<SpotifyCredentials>;
}