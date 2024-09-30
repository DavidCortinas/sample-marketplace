import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from '@remix-run/react';
import { Tooltip } from '../Tooltip';
import { Playlist } from '../../types/playlists/types';
import { getRandomColorClass } from '../../utils/forms';

interface PlaylistsFormProps {
  savedPlaylists: Playlist[];
  selectedPlaylist: Playlist | null;
  selectPlaylist: (playlistId: string) => void;
  isLoadingPlaylists: boolean;
  error: string | null;
  colorClassRefs: { [key: string]: string };
}

export function PlaylistsForm({
  savedPlaylists,
  selectedPlaylist,
  selectPlaylist,
  isLoadingPlaylists,
  error,
  colorClassRefs
}: PlaylistsFormProps) {
  console.log('savedPlaylists', savedPlaylists);
	const [hoveredPlaylistId, setHoveredPlaylistId] = useState<string | null>(null);
	const navigate = useNavigate();
	const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  console.log('colorClassRefs', colorClassRefs);
	
	// Generate colors once and memoize them
	// const colorClassRefs = useMemo(() => {
	// 	const colors: { [key: string]: string } = {};
	// 	if (savedPlaylists && savedPlaylists.items) {
	// 		savedPlaylists.items.forEach((playlist) => {
	// 			colors[playlist.id] = getRandomColorClass();
	// 		});
	// 	}
	// 	return colors;
	// }, [savedPlaylists]);

	const handleSelectPlaylist = (playlist: Playlist) => {
		console.log('Selected playlist:', playlist);
		selectPlaylist(playlist.id);
	};

	if (isLoadingPlaylists) {
		return <div>Loading playlists...</div>;
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

  console.log('selectedPlaylist', selectedPlaylist);

	if (!savedPlaylists || !savedPlaylists.items || savedPlaylists.items.length === 0) {
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

	return (
		<div className="flex-1 overflow-y-auto p-4">
			<h2 className="text-lg text-center font-semibold mb-4">Your Playlists</h2>
			<div className="flex flex-col space-y-2">
				{savedPlaylists.items.map((playlist) => (
					<div 
						key={playlist.id} 
						className="relative"
						onMouseEnter={() => setHoveredPlaylistId(playlist.id)}
						onMouseLeave={() => setHoveredPlaylistId(null)}
					>
						<button 
							ref={(el) => buttonRefs.current[playlist.id] = el}
							className={`w-full px-4 py-2 rounded-full text-sm text-white text-center font-medium transition-colors text-left ${colorClassRefs[`playlist_${playlist.id}`]}`}
							onClick={() => handleSelectPlaylist(playlist)}
						>
							<span className="truncate block">{playlist.name}</span>
						</button>
						{hoveredPlaylistId === playlist.id && (
							<Tooltip 
								text="View playlist details"
								targetRect={buttonRefs.current[playlist.id]?.getBoundingClientRect() || null}
								position="right"
							/>
						)}
					</div>
				))}
			</div>
		</div>
	);
}