import { useState, useRef, useEffect } from 'react';
import { Tooltip } from '../Tooltip';
import { AlertModal } from '../AlertModal';
import { SkeletonPlaylist } from './SkeletonPlaylist';
import { Playlist } from '../../types/playlists/types';

interface PlaylistsFormProps {
  error: string | null;
  selectPlaylist: (playlistId: string) => void;
  totalPlaylists: number;
  limit: number;
  loadMore: () => void;
  loadPrevious: () => void;
  changeLimit: (newLimit: number) => void;
  deletePlaylist: (playlistId: string) => void;
  isDeletingPlaylist: boolean;
  isLoadingPlaylists: boolean;
  savedPlaylists: Playlist[];
  loadPage: (pageNumber: number) => void; 
  handleInitiateNewPlaylist: () => void;
}

const borderColorClasses = [
  'border-red-500',
  'border-blue-500',
  'border-green-500',
  'border-yellow-500',
  'border-purple-500',
  'border-pink-500',
  'border-indigo-500',
  'border-teal-500',
];

export function PlaylistsForm({
  error,
  selectPlaylist,
  totalPlaylists,
  limit,
  loadMore,
  loadPrevious,
  changeLimit,
  deletePlaylist,
  isDeletingPlaylist,
  savedPlaylists,
  isLoadingPlaylists,
  loadPage,
  handleInitiateNewPlaylist,
}: PlaylistsFormProps) {
	const [hoveredPlaylistId, setHoveredPlaylistId] = useState<string | null>(null);
  const [hoveredSelectId, setHoveredSelectId] = useState<string | null>(null);
  const [hoveredDeleteId, setHoveredDeleteId] = useState<string | null>(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [borderColors, setBorderColors] = useState<{ [key: string]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectTooltipRect, setSelectTooltipRect] = useState<{ [key: string]: DOMRect | null }>({});
  const [deleteTooltipRect, setDeleteTooltipRect] = useState<{ [key: string]: DOMRect | null }>({});
  const [inputPage, setInputPage] = useState(currentPage.toString());

	const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
	const deleteButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
	
  const totalPages = Math.ceil(totalPlaylists / limit);

  useEffect(() => {
    const newBorderColors: { [key: string]: string } = {};
    savedPlaylists.forEach((playlist) => {
      if (!borderColors[playlist.id]) {
        newBorderColors[playlist.id] = borderColorClasses[Math.floor(Math.random() * borderColorClasses.length)];
      }
    });
    setBorderColors(prev => ({ ...prev, ...newBorderColors }));
  }, [savedPlaylists]);

  useEffect(() => {
    setCurrentPage(1);
  }, [limit, totalPlaylists]);

	const handleSelectPlaylist = (playlist: Playlist) => {
		selectPlaylist(playlist.id);
	};

	const handleDeletePlaylist = (playlist: Playlist, event: React.MouseEvent) => {
		event.stopPropagation();
		setPlaylistToDelete(playlist);
		setDeleteModalOpen(true);
	};

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      loadMore();
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      loadPrevious();
    }
  };

	const confirmDeletePlaylist = () => {
		if (playlistToDelete) {
			deletePlaylist(playlistToDelete.id);
		}
	};

  useEffect(() => {
    if (hoveredPlaylistId) {
      const selectButton = buttonRefs.current[hoveredPlaylistId];
      const deleteButton = deleteButtonRefs.current[hoveredPlaylistId];

      if (selectButton) {
        setSelectTooltipRect(prev => ({ ...prev, [hoveredPlaylistId]: selectButton.getBoundingClientRect() }));
      }
      if (deleteButton) {
        setDeleteTooltipRect(prev => ({ ...prev, [hoveredPlaylistId]: deleteButton.getBoundingClientRect() }));
      }
    }
  }, [hoveredPlaylistId]);

  useEffect(() => {
    if (hoveredSelectId) {
      const selectButton = buttonRefs.current[hoveredSelectId];
      if (selectButton) {
        setSelectTooltipRect(prev => ({ ...prev, [hoveredSelectId]: selectButton.getBoundingClientRect() }));
      }
    }
  }, [hoveredSelectId]);

  useEffect(() => {
    if (hoveredDeleteId) {
      const deleteButton = deleteButtonRefs.current[hoveredDeleteId];
      if (deleteButton) {
        setDeleteTooltipRect(prev => ({ ...prev, [hoveredDeleteId]: deleteButton.getBoundingClientRect() }));
      }
    }
  }, [hoveredDeleteId]);

  const renderPlaylists = () => {
    if (isLoadingPlaylists) {
      return Array.from({ length: limit }).map((_, index) => (
        <SkeletonPlaylist key={`skeleton-${index}`} />
      ));
    }

    return savedPlaylists.map((playlist) => (
      <div 
        key={playlist.id}
        className={`flex items-center justify-between bg-bg-secondary p-2 rounded-t-md border-l-4 ${borderColors[playlist.id] || 'border-gray-500'} relative group`}
        onMouseEnter={() => setHoveredPlaylistId(playlist.id)}
        onMouseLeave={() => {
          setHoveredPlaylistId(null);
          setHoveredSelectId(null);
          setHoveredDeleteId(null);
          setSelectTooltipRect(prev => ({ ...prev, [playlist.id]: null }));
          setDeleteTooltipRect(prev => ({ ...prev, [playlist.id]: null }));
        }}
      >
        <div className="flex items-center min-w-0 flex-1">
          {playlist.imageUrl && (
            <img src={playlist.imageUrl} alt={playlist.name} className="w-6 h-6 mr-2 rounded-full flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <button 
              ref={el => buttonRefs.current[playlist.id] = el}
              className="font-medium truncate text-left w-full flex items-center justify-between"
              onClick={() => handleSelectPlaylist(playlist)}
              onMouseEnter={() => setHoveredSelectId(playlist.id)}
              onMouseLeave={() => setHoveredSelectId(null)}
            >
              <div className="flex flex-col truncate">
                <span className="truncate">{playlist.name}</span>
                {playlist.description && (
                  <div className="text-sm text-text-secondary truncate">{playlist.description}</div>
                )}
              </div>
            </button>
            {hoveredSelectId === playlist.id && selectTooltipRect[playlist.id] && (
              <Tooltip
                text={`Select ${playlist.name}`}
                targetRect={selectTooltipRect[playlist.id]}
                position="bottom"
              />
            )}
          </div>
        </div>
        {hoveredPlaylistId === playlist.id && (
          <button
            ref={el => deleteButtonRefs.current[playlist.id] = el}
            onClick={(e) => handleDeletePlaylist(playlist, e)}
            className="absolute bottom-1 right-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isDeletingPlaylist}
            onMouseEnter={() => setHoveredDeleteId(playlist.id)}
            onMouseLeave={() => setHoveredDeleteId(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        {hoveredDeleteId === playlist.id && deleteTooltipRect[playlist.id] && (
          <Tooltip
            text={`Delete ${playlist.name}`}
            targetRect={deleteTooltipRect[playlist.id]}
            position="right"
          />
        )}
      </div>
    ));
  };

	if (error) {
		return <div>Error: {error}</div>;
	}

	if (!isLoadingPlaylists && (!savedPlaylists || savedPlaylists.length === 0)) {
		return (
			<div className="flex-1 overflow-y-auto p-4">
				<h2 className="text-lg text-center font-semibold">Playlists</h2>
				<p className="text-center text-text-secondary mt-4">You don't have any playlists yet.</p>
				<div className="mt-4 text-center">
					<button
						onClick={handleInitiateNewPlaylist}
						className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
					>
						Create a New Playlist
					</button>
				</div>
			</div>
		);
	}

	const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputPage(e.target.value);
	};

	const handleGoToPage = () => {
		const pageNumber = parseInt(inputPage, 10);
		if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
			console.log(`Navigating to page ${pageNumber}`);
			setCurrentPage(pageNumber);
			loadPage(pageNumber);
		} else {
			console.log(`Invalid page number: ${pageNumber}`);
			setInputPage(currentPage.toString());
		}
	};

	return (
		<div className="flex-1 overflow-y-auto p-4">
			<h2 className="text-lg text-center font-semibold">Your Playlists</h2>
      <h3 className="text-sm text-center font-medium mb-2">
        {isLoadingPlaylists 
          ? "Loading playlists..." 
          : (
            <span>
              Showing{' '}
              <select 
                id="limit-select"
                value={limit} 
                onChange={(e) => changeLimit(Number(e.target.value))}
                className="border rounded p-1 h-8 inline-block"
              >
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              {' '}of {totalPlaylists} playlists
            </span>
          )
        }
      </h3>

			<div className="flex flex-col space-y-2">
				{renderPlaylists()}
			</div>

      {/* Updated pagination controls */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={goToPreviousPage}
            disabled={currentPage === 1 || isLoadingPlaylists}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 h-8 w-8 flex items-center justify-center"
          >
            ←
          </button>

          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={inputPage}
              onChange={handlePageInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleGoToPage()}
              className="w-16 h-8 px-2 border rounded text-center"
            />
            <button
              onClick={handleGoToPage}
              disabled={isLoadingPlaylists}
              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 h-8"
            >
              Go
            </button>
          </div>

          <button 
            onClick={goToNextPage}
            disabled={currentPage === totalPages || isLoadingPlaylists}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 h-8 w-8 flex items-center justify-center"
          >
            →
          </button>
        </div>

        <div className="mt-2 text-center">
          {isLoadingPlaylists ? `Loading page ${currentPage} of ${totalPages}...` : `Page ${currentPage} of ${totalPages}`}
        </div>
      </div>

			<AlertModal
				isOpen={deleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				onConfirm={confirmDeletePlaylist}
				title="Delete Playlist"
				message={`Are you sure you want to delete the playlist "${playlistToDelete?.name}"?`}
				confirmText="Delete"
				cancelText="Cancel"
			/>
		</div>
	);
}