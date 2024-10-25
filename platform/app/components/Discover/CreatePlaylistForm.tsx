import React from 'react';
import { Playlist } from '../../types/playlists/types';

interface CreatePlaylistFormProps {
  newPlaylistName: string;
  updateNewPlaylistName: (name: string) => void;
  saveNewPlaylist: (playlist: Playlist) => Promise<void>;
  isLoading: boolean;
}

export const CreatePlaylistForm: React.FC<CreatePlaylistFormProps> = ({
  newPlaylistName,
  updateNewPlaylistName,
  saveNewPlaylist,
  isLoading
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveNewPlaylist({ name: newPlaylistName, id: '', tracks: [] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="playlistName" className="block text-sm font-medium text-gray-700">
          Playlist Name
        </label>
        <input
          type="text"
          id="playlistName"
          value={newPlaylistName}
          onChange={(e) => updateNewPlaylistName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Enter playlist name"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !newPlaylistName.trim()}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Playlist'}
      </button>
    </form>
  );
};
