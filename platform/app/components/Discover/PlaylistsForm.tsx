import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { Tooltip } from '../Tooltip';
import { AlertModal } from '../AlertModal';
import { SkeletonPlaylist } from './SkeletonPlaylist';
import { Playlist, Track } from '../../types/playlists/types';
import { usePlaylists } from '../../hooks/usePlaylists';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';

interface PlaylistsFormProps {
  error: string | null;
  colorClassRefs: { [key: string]: string };
  selectPlaylist: (playlistId: string) => void;
  selectedPlaylist: Playlist | null;
  selectedPlaylistTracks: Track[];
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
  colorClassRefs,
  selectPlaylist,
  selectedPlaylist,
  selectedPlaylistTracks,
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
  const [borderColors, setBorderColors] = useState<{ [key: string]: string }>({});
	const navigate = useNavigate();
	const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
	const deleteButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
	
  const [currentPage, setCurrentPage] = useState(1);
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

  const renderPlaylists = () => {
    if (isLoadingPlaylists) {
      return Array.from({ length: limit }).map((_, index) => (
        <SkeletonPlaylist key={`skeleton-${index}`} />
      ));
    }

return savedPlaylists.map((playlist) => (
    <div key={playlist.id} className="mb-4">
      <div 
        className={`flex items-center justify-between bg-bg-secondary p-2 rounded-t-md border-l-4 ${borderColors[playlist.id] || 'border-gray-500'}`}
      >
        <div className="flex items-center min-w-0 flex-1">
          {playlist.imageUrl && (
            <img src={playlist.imageUrl} alt={playlist.name} className="w-6 h-6 mr-2 rounded-full flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <button 
              className="font-medium truncate text-left w-full flex items-center justify-between"
              onClick={() => handleSelectPlaylist(playlist)}
            >
              <div className="flex flex-col truncate">
                <span className="truncate">{playlist.name}</span>
                {playlist.description && (
                  <div className="text-sm text-text-secondary truncate">{playlist.description}</div>
                )}
              </div>
              {selectedPlaylist?.id === playlist.id ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <button
          onClick={(e) => handleDeletePlaylist(playlist, e)}
          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
          disabled={isDeletingPlaylist}
        >
          &times;
        </button>
      </div>
      {selectedPlaylist?.id === playlist.id && (
        <div className="bg-bg-tertiary rounded-b-md border-l-4 border-r-4 border-b-4 border-t-0 border-opacity-50" style={{borderColor: borderColors[playlist.id] || 'rgb(107, 114, 128)'}}>
          {selectedPlaylistTracks && selectedPlaylistTracks.items.map((item, index) => (
            <div key={item.track.id} className='flex items-center py-2 border-b last:border-b-0 border-gray-600'>
              <div className='truncate flex-1'>
                <span className="font-medium">{item.track.name}</span>
                <span className="text-sm text-gray-400"> - {item.track.artists[0].name}</span>
              </div>
            </div>
          ))}
        </div>
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