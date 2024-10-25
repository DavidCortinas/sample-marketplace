import React, { memo } from 'react';
import { DragDropContext, DraggableRubric, Draggable, DraggableStateSnapshot, Droppable, DraggableProvided, DropResult } from 'react-beautiful-dnd';
import { Playlist } from '../../types/playlists/types';
import { TracksObject } from './PlaylistSidebar';

interface EditPlaylistFormProps {
  playlistName: string;
  updatePlaylistName: (name: string) => void;
  savePlaylist: (playlist: Playlist) => Promise<void>;
  isLoading: boolean;
  isNewPlaylist: boolean;
  tracks: TracksObject;
  onReorder: (result: DropResult) => void;
  renderDraggable: (provided: DraggableProvided, snapshot: DraggableStateSnapshot, rubric: DraggableRubric) => React.ReactNode;
}

function GripIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-gray-400"
    >
      <path d="M9 5h2v14H9zm4 0h2v14h-2z" />
    </svg>
  );
}

const TrackItem = memo(({ track, index, draggableId, renderDraggable }: TrackItemProps) => {
  return (
    <Draggable draggableId={draggableId} index={index}>
      {renderDraggable((provided, snapshot) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex items-center bg-bg-secondary p-2 m-2 rounded-md ${
            snapshot.isDragging ? 'shadow-lg' : ''
          }`}
        >
          <img
            src={track.album?.images[0]?.url || '/default-album.jpg'}
            alt={`${track.name} album cover`}
            className="w-10 h-10 rounded-md mr-3 object-cover flex-shrink-0"
          />
          <div className="flex-grow min-w-0">
            <p className="font-medium truncate">{track.name}</p>
            <p className="text-sm text-text-secondary truncate">
              {track.artists.map(artist => artist.name).join(', ')}
            </p>
          </div>
          <div className="ml-2 cursor-move flex-shrink-0">
            <GripIcon />
          </div>
        </li>
      ))}
    </Draggable>
  );
});

TrackItem.displayName = 'TrackItem';

export const EditPlaylistForm: React.FC<EditPlaylistFormProps> = ({
  playlistName,
  updatePlaylistName,
  savePlaylist,
  isLoading,
  isNewPlaylist,
  tracks,
  onReorder,
  renderDraggable
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePlaylist({ name: playlistName, id: '', tracks: tracks });
  };

  if (isLoading) {
    return <div className="mt-4">Loading playlist tracks...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 py-2">
      {/* <div> */}
        {/* <label htmlFor="playlistName" className="block text-sm font-medium text-gray-700">
          Playlist Name
        </label> */}
        <input
          type="text"
          id="playlistName"
          value={playlistName}
          onChange={(e) => updatePlaylistName(e.target.value)}
          className="w-full px-3 py-2 bg-input-bg text-input-text border border-input-border rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
          placeholder="Enter playlist name"
          required
        />
      {/* </div> */}
      <DragDropContext onDragEnd={onReorder}>
        <Droppable droppableId="playlist">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2 flex-grow overflow-y-auto"
            >
              {tracks && tracks.items.length > 0 ? (
                tracks.items.map((track, index) => {
                  const draggableId = `track-${track.id}-${index}`;
                  return (
                    <TrackItem
                      key={draggableId}
                      track={track}
                      index={index}
                      draggableId={draggableId}
                      renderDraggable={renderDraggable}
                    />
                  );
                })
              ) : (
                <li className="text-center py-4">No tracks in this playlist</li>
              )}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <button
        type="submit"
        disabled={isLoading || !playlistName?.trim()}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Playlist'}
      </button>
    </form>
  );
};
