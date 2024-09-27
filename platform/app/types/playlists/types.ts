export interface Artist {
  name: string;
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: {
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export interface Playlists {
  href: string;
  items: Playlist[];
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
}
