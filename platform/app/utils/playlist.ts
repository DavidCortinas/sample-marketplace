import { User } from "../types/user";
import { Playlist } from "../types/playlists/types";

export function createEmptyPlaylist(user: User | null): Playlist {
  return {
    id: 'temp-id',
    name: 'New Playlist',
    description: '',
    public: false,
    collaborative: false,
    tracks: { total: 0 },
    owner: { 
      id: user?.id || '', 
      display_name: user?.display_name || '' 
    },
  };
}


