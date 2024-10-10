import React, { memo , useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { SpotifyEmbed } from './SpotifyEmbed';
import { useToast } from '../Toast/useToast';
import { ToastContainer } from '../Toast/ToastContainer';

interface MusicGridProps {
  recommendations: string[];
  playlistTracks: { uri: string, name: string, artists: string }[];
  onLoadMore: () => void;
  isLoading: boolean;
  isInitialLoad: boolean;
  selectedTab: 'recommendations' | 'playlist';
  isMobile: boolean;
  selectedPlaylist: string | null;
  removeTrackFromPlaylist: (playlistId: string, trackUri: string) => void;
}

// eslint-disable-next-line react/prop-types
const LocalTrackPlaceholder: React.FC<{ name: string, artists: string }> = ({ name, artists }) => (
  <div className="bg-gray-300 p-4 rounded">
    <p>Local Track: {name} - {artists}</p>
    <p className="text-sm text-gray-500">This track is not available on Spotify</p>
  </div>
);

const MemoizedSpotifyEmbed = memo(SpotifyEmbed, (prevProps, nextProps) => {
  return prevProps.uri === nextProps.uri &&
         prevProps.selectedPlaylist?.id === nextProps.selectedPlaylist?.id;
});

export function MusicGrid({ 
  recommendations, 
  playlistTracks, 
  onLoadMore, 
  isLoading, 
  isInitialLoad, 
  selectedTab,
  isMobile,
  selectedPlaylist,
  removeTrackFromPlaylist
}: MusicGridProps) {

  const observer = useRef<IntersectionObserver | null>(null);
  const [visibleResults, setVisibleResults] = useState<string[]>([]);
  const [batchSize] = useState(9);
  const { toasts, addToast, removeToast, clearToasts } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);
  const lastItemRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const results = useMemo(() => 
    selectedTab === 'recommendations' ? recommendations : playlistTracks.map(track => track.uri),
    [selectedTab, recommendations, playlistTracks]
  );

  const hasLocalTracks = useMemo(() => 
    playlistTracks.some(track => track.uri.startsWith('spotify:local')),
    [playlistTracks]
  );

  const loadMoreResults = useCallback(() => {
    if (!isLoading && results.length > visibleResults.length && !isLoadingMore) {
      setIsLoadingMore(true);
      const nextBatch = results.slice(visibleResults.length, visibleResults.length + batchSize);
      setVisibleResults(prev => [...prev, ...nextBatch]);
    }
  }, [isLoading, results, visibleResults, batchSize, isLoadingMore]);

  const lastResultRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreResults();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, loadMoreResults]);

  const resultsKey = useMemo(() => 
    `${selectedTab}-${results.length}-${playlistTracks.length}`,
    [selectedTab, results, playlistTracks]
  );

  useEffect(() => {
    // Reset visible results when results change
    setVisibleResults(results.slice(0, batchSize));
    
    if (selectedTab === 'recommendations') {
      clearToasts();
    }
  }, [resultsKey, batchSize, selectedTab, clearToasts, results]);

  useEffect(() => {
    if (results.length > visibleResults.length && !isLoading && !isLoadingMore) {
      loadMoreResults();
    }
  }, [results, visibleResults, isLoading, isLoadingMore, loadMoreResults]);

  useEffect(() => {
    if (isLoadingMore && !isLoading) {
      setIsLoadingMore(false);
      if (lastItemRef.current) {
        lastItemRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' });
      }
    }
  }, [isLoading, isLoadingMore]);

  useEffect(() => {
    if (hasLocalTracks && selectedTab === 'playlist') {
      const existingToast = toasts.find(toast => 
        toast.message === 'This playlist contains local tracks that may not be playable through Spotify.'
      );
      if (!existingToast) {
        addToast({
          message: 'This playlist contains local tracks that may not be playable through Spotify.',
          type: 'warning',
        });
      }
    } else if (!hasLocalTracks || selectedTab === 'recommendations') {
      const localTrackToast = toasts.find(toast => 
        toast.message === 'This playlist contains local tracks that may not be playable through Spotify.'
      );
      if (localTrackToast) {
        removeToast(localTrackToast.id);
      }
    }
  }, [hasLocalTracks, selectedTab, addToast, removeToast, toasts]);

  if (isInitialLoad || results.length === 0) {
    if (selectedTab === 'recommendations') {
      return (
        <div className="flex justify-center items-start my-12 md:items-center h-full">
          <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-4 rounded-lg shadow-md max-w-md w-full text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Discover?</h2>
            <p className="mb-6 text-orange-100">
              {`Use the control panel ${isMobile ? 'above' : 'in the sidebar'} to start digging up musical gems! Adjust your preferences and watch as we unearth tracks tailored just for you.`}
            </p>
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex justify-center items-start my-12 md:items-center h-full">
          <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-4 rounded-lg shadow-md max-w-md w-full text-white">
            <h2 className="text-2xl font-bold mb-4">This playlist is empty</h2>
            <p className="mb-6 text-orange-100">
              {`There are no tracks in this playlist. Use the recommendation engine ${isMobile ? 'above' : 'in the sidebar'} to unearth and add new tracks.`}
            </p>
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          </div>
        </div> 
      );
    }
  }

  return visibleResults.length ? (
    <div className="space-y-8" ref={gridRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hasLocalTracks ? (
          <>
            {playlistTracks.map((track, index) => (
              <LocalTrackPlaceholder key={`${track.uri}-${index}`} name={track.name} artists={track.artists} />
            ))}
          </>
        ) : (
          visibleResults.map((result, index) => (
            <div 
              key={`${result}-${index}`}
              ref={index === visibleResults.length - 1 ? lastItemRef : null}
              className="relative group"
            >
              <MemoizedSpotifyEmbed 
                uri={result} 
                selectedPlaylist={selectedPlaylist}
                playlistTracks={playlistTracks}
                removeTrackFromPlaylist={removeTrackFromPlaylist}
              />
              {index === visibleResults.length - 2 && (
                <div ref={lastResultRef} style={{ height: '1px' }} />
              )}
            </div>
          ))
        )}
      </div>
      {isLoading && (
        <div className="text-center py-4 text-gray-600 font-semibold">
          Digging up more gems...
        </div>
      )}
      <ToastContainer toasts={toasts} onClose={removeToast} position="bottom-right" />
    </div>
  ) : selectedTab === 'recommendations' ? (
    <div className="flex justify-center items-start my-12 md:items-center h-full">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-4 rounded-lg shadow-md max-w-md w-full text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Discover?</h2>
        <p className="mb-6 text-orange-100">
          {`Use the control panel ${isMobile ? 'above' : 'in the sidebar'} to start digging up musical gems! Adjust your preferences and watch as we unearth tracks tailored just for you.`}
        </p>
        <div className="flex justify-center">
          <svg className="w-12 h-12 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex justify-center items-start my-12 md:items-center h-full">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-4 rounded-lg shadow-md max-w-md w-full text-white">
        <h2 className="text-2xl font-bold mb-4">This playlist is empty</h2>
        <p className="mb-6 text-orange-100">
          {`There are no tracks in this playlist. Use the recommendation engine ${isMobile ? 'above' : 'in the sidebar'} to unearth and add new tracks.`}
        </p>
        <div className="flex justify-center">
          <svg className="w-12 h-12 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      </div>
    </div> 
  );
}