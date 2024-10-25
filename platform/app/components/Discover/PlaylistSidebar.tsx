import { useCallback, memo } from 'react';
import { useDraggableInPortal } from '../../hooks/useDraggableInPortal';
import { Playlist, Track } from '../../types/playlists/types';
import { EditPlaylistForm } from './EditPlaylistForm';

export interface TracksObject {
  href: string;
  items: Track[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

interface PlaylistSidebarProps {
  tracks: TracksObject;
  onReorder: (result: any) => void;
  onBackToPlaylists: () => void; 
  saveNewPlaylist: (playlist: Playlist) => void | Promise<void>;
  isEditingNewPlaylist: boolean;
  newPlaylistName: string;
  updateNewPlaylistName: (name: string) => void;
  isLoadingPlaylists: boolean;
}

const PlaylistSidebar = memo(({ 
  tracks, 
  onReorder, 
  onBackToPlaylists, 
  saveNewPlaylist,
  isEditingNewPlaylist,
  newPlaylistName,
  updateNewPlaylistName,
  isLoadingPlaylists,
}: PlaylistSidebarProps) => {
  const renderDraggable = useDraggableInPortal();

  const saveNewPlaylistWrapper = useCallback(
    async (playlist: Playlist) => {
      const result = saveNewPlaylist(playlist);
      if (result instanceof Promise) {
        await result;
      }
    },
    [saveNewPlaylist]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-2">
        <BackToPlaylistsButton onBackToPlaylists={onBackToPlaylists} />
      </div>
      <EditPlaylistForm
        playlistName={newPlaylistName}
        updatePlaylistName={updateNewPlaylistName}
        savePlaylist={saveNewPlaylistWrapper}
        isLoading={isLoadingPlaylists}
        isNewPlaylist={isEditingNewPlaylist}
        tracks={tracks}
        onReorder={onReorder}
        renderDraggable={renderDraggable}
      />
    </div>
  );
});

PlaylistSidebar.displayName = 'PlaylistSidebar';

const BackToPlaylistsButton = ({ onBackToPlaylists }: { onBackToPlaylists: () => void }) => (
  <button
    onClick={onBackToPlaylists}
    className="flex items-center text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
  >
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    Back to Playlists
  </button>
);

export { PlaylistSidebar };
