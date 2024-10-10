import React, { useCallback, useEffect, memo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useDraggableInPortal } from '../../hooks/useDraggableInPortal';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
}

interface PlaylistSidebarProps {
  tracks: Track[];
  onReorder: (result: any) => void;
}

const PlaylistSidebar = memo(({ tracks, onReorder }: PlaylistSidebarProps) => {
  const renderDraggable = useDraggableInPortal();

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    onReorder(result);
  }, [onReorder]);

  if (!tracks || tracks.length === 0) {
    return <div>Loading playlist tracks...</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="playlist">
        {(provided) => (
          <ul
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {tracks.items.map((item, index) => {
              const draggableId = `track-${item.track.id}-${index}`;
              return (
                <TrackItem
                  key={draggableId}
                  track={item.track}
                  index={index}
                  draggableId={draggableId}
                  renderDraggable={renderDraggable}
                />
              );
            })}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
});

PlaylistSidebar.displayName = 'PlaylistSidebar';

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

export { PlaylistSidebar };

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