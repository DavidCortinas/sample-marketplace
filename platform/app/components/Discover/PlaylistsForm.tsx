import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { Tooltip } from '../Tooltip';
import { AlertModal } from '../AlertModal';
import { SkeletonPlaylist } from '../SkeletonPlaylist';
import { Playlist } from '../../types/playlists/types';
import { usePlaylists } from '../../hooks/usePlaylists';

interface PlaylistsFormProps {
  error: string | null;
  colorClassRefs: { [key: string]: string };
  selectPlaylist: (playlistId: string) => void;
  selectedPlaylist: Playlist | null;
  totalPlaylists: number;
  limit: number;
  hasMore: boolean;
  loadMore: () => void;
  loadPrevious: () => void;
  changeLimit: (newLimit: number) => void;
  deletePlaylist: (playlistId: string) => void;
  isDeletingPlaylist: boolean;
  isLoadingPlaylists: boolean;
  savedPlaylists: Playlist[];
  loadPage: (pageNumber: number) => void; 
}

export function PlaylistsForm({
  error,
  colorClassRefs,
  selectPlaylist,
  selectedPlaylist,
  totalPlaylists,
  limit,
  hasMore,
  loadMore,
  loadPrevious,
  changeLimit,
  deletePlaylist,
  isDeletingPlaylist,
  savedPlaylists,
  isLoadingPlaylists,
  loadPage // Add this prop to handle loading a specific page
}: PlaylistsFormProps) {
	const [hoveredPlaylistId, setHoveredPlaylistId] = useState<string | null>(null);
	const [hoveredDeleteId, setHoveredDeleteId] = useState<string | null>(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
	const navigate = useNavigate();
	const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
	const deleteButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
	
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalPlaylists / limit);

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

  const renderPlaylists = () => {
    if (isLoadingPlaylists) {
      return Array.from({ length: limit }).map((_, index) => (
        <SkeletonPlaylist key={`skeleton-${index}`} />
      ));
    }
    console.log('savedPlaylists', savedPlaylists)

    return savedPlaylists.map((playlist) => (
      <div 
        key={playlist.id} 
        className="relative group flex justify-center"
        onMouseEnter={() => setHoveredPlaylistId(playlist.id)}
        onMouseLeave={() => setHoveredPlaylistId(null)}
      >
        <button 
          ref={(el) => buttonRefs.current[playlist.id] = el}
          className={`w-5/6 px-4 py-2 rounded-full text-sm text-white text-center font-medium transition-colors text-left ${colorClassRefs[`playlist_${playlist.id}`] || 'bg-gray-500'}`}
          onClick={() => handleSelectPlaylist(playlist)}
        >
          <span className="truncate block">{playlist.name}</span>
        </button>
        <button
          ref={(el) => deleteButtonRefs.current[playlist.id] = el}
          className="absolute right-1 top-1/4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 transition-all duration-200 ease-in-out scale-75 group-hover:scale-100"
          onClick={(e) => handleDeletePlaylist(playlist, e)}
          onMouseEnter={() => setHoveredDeleteId(playlist.id)}
          onMouseLeave={() => setHoveredDeleteId(null)}
          disabled={isDeletingPlaylist}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 wiggle-animation" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="round" stroke='white' strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        {hoveredPlaylistId === playlist.id && hoveredDeleteId !== playlist.id && (
          <Tooltip 
            text="View playlist details"
            targetRect={buttonRefs.current[playlist.id]?.getBoundingClientRect() || null}
            position="right"
          />
        )}
        {hoveredDeleteId === playlist.id && (
          <Tooltip 
            text={`Delete ${playlist.name} playlist?`}
            targetRect={deleteButtonRefs.current[playlist.id]?.getBoundingClientRect() || null}
            position="left"
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
						onClick={() => navigate('/create-playlist')}
						className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
					>
						Create a Playlist
					</button>
				</div>
			</div>
		);
	}

	const [inputPage, setInputPage] = useState(currentPage.toString());

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