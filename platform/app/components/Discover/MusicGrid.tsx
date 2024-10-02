import { SpotifyEmbed } from '../SpotifyEmbed';
import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
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
}

// eslint-disable-next-line react/prop-types
const LocalTrackPlaceholder: React.FC<{ name: string, artists: string }> = ({ name, artists }) => (
  <div className="bg-gray-300 p-4 rounded">
    <p>Local Track: {name} - {artists}</p>
    <p className="text-sm text-gray-500">This track is not available on Spotify</p>
  </div>
);

export function MusicGrid({ 
  recommendations, 
  playlistTracks, 
  onLoadMore, 
  isLoading, 
  isInitialLoad, 
  selectedTab,
  isMobile
}: MusicGridProps) {
  const observer = useRef<IntersectionObserver | null>(null);
  const [visibleResults, setVisibleResults] = useState<string[]>([]);
  const [batchSize] = useState(9);
  const { toasts, addToast, removeToast, clearToasts } = useToast();
  
  const results = useMemo(() => 
    selectedTab === 'recommendations' ? recommendations : playlistTracks.map(track => track.uri),
    [selectedTab, recommendations, playlistTracks]
  );

  const hasLocalTracks = useMemo(() => 
    playlistTracks.some(track => track.uri.startsWith('spotify:local')),
    [playlistTracks]
  );

  const loadMoreVisibleResults = useCallback(() => {
    if (results.length > visibleResults.length) {
      const nextBatch = results.slice(visibleResults.length, visibleResults.length + batchSize);
      setVisibleResults(prev => [...prev, ...nextBatch]);
    }
  }, [results, visibleResults, batchSize]);

  const loadMoreResults = useCallback(() => {
    if (!isLoading && results.length === visibleResults.length) {
      onLoadMore();
    }
  }, [isLoading, results.length, visibleResults.length, onLoadMore]);

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
    // Load more visible results if we have more results than visible
    if (results.length > visibleResults.length && !isLoading) {
      loadMoreVisibleResults();
    }
  }, [results.length, visibleResults.length, isLoading, loadMoreVisibleResults]);

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

  if (isInitialLoad) {
    return null;
  }

  return visibleResults.length ? (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {Array.from({ length: visibleResults.length || batchSize }).map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-md flex items-center justify-center h-24">
                <p className="text-gray-600 font-semibold">Unearthing find...</p>
              </div>
            ))}
          </>
        ) : hasLocalTracks ? (
          <>
            {playlistTracks.map((track, index) => (
              <LocalTrackPlaceholder key={index} name={track.name} artists={track.artists} />
            ))}
          </>
        ) : (visibleResults.map((result, index) => (
            <div 
              key={`${result}-${index}-${resultsKey}`} 
              ref={index === visibleResults.length - 1 ? lastResultRef : null}
            >
              <SpotifyEmbed uri={result} />
            </div>
        )))}
      </div>
      {isLoading && (
        <div className="text-center py-4 text-gray-600 font-semibold">
          Digging up more gems...
        </div>
      )}
      <ToastContainer toasts={toasts} onClose={removeToast} position="bottom-right" />
    </div>
  ) : (
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
}

