import { useOutletContext } from "@remix-run/react";
import { useCallback, useState, useEffect } from "react";

export interface SpotifyCredentials {
  access_token: string;
  expires_in: number;
  timestamp: number;
}

interface OutletContext {
  spotifyCredentials: SpotifyCredentials;
  refreshSpotifyToken: () => Promise<SpotifyCredentials>;
}

export function useSpotify() {
  const { spotifyCredentials: initialCredentials, refreshSpotifyToken } = useOutletContext<OutletContext>();
  const [spotifyCredentials, setSpotifyCredentials] = useState(initialCredentials);

  const isTokenExpired = useCallback(() => {
    if (!spotifyCredentials) return true;
    const now = Date.now();
    const expirationTime = spotifyCredentials.timestamp + (spotifyCredentials.expires_in * 1000) - 60000; // Refresh 1 minute early
    return now > expirationTime;
  }, [spotifyCredentials]);

  const getAccessToken = useCallback(async () => {
    if (isTokenExpired()) {
      try {
        const newCredentials = await refreshSpotifyToken();
        setSpotifyCredentials(newCredentials);
        return newCredentials.access_token;
      } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
      }
    }
    return spotifyCredentials.access_token;
  }, [isTokenExpired, refreshSpotifyToken, spotifyCredentials]);

  useEffect(() => {
    setSpotifyCredentials(initialCredentials);
  }, [initialCredentials]);

  return {
    getAccessToken,
    isAuthenticated: () => !!spotifyCredentials?.access_token,
  };
}
