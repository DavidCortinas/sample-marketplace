import { SpotifyEmbed } from '../SpotifyEmbed';
import { useCallback, useRef, useState, useEffect } from 'react';

interface DiscoverResultsProps {
  results: string[];
  onLoadMore: () => void;
  isLoading: boolean;
  isInitialLoad: boolean;
}

export function DiscoverResults({ results, onLoadMore, isLoading, isInitialLoad }: DiscoverResultsProps) {
  const observer = useRef<IntersectionObserver | null>(null);
  const [visibleResults, setVisibleResults] = useState<string[]>([]);
  const [batchSize] = useState(9); // Adjust this value based on your preference

  const lastResultRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoading) {
        onLoadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [onLoadMore, isLoading]);

  useEffect(() => {
    setVisibleResults(prevResults => {
      const newResults = results.slice(prevResults.length, prevResults.length + batchSize);
      return [...prevResults, ...newResults];
    });
  }, [results, batchSize]);

  if (isInitialLoad) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleResults.map((result, index) => (
          <div 
            key={`${result}-${index}`} 
            ref={index === visibleResults.length - 1 ? lastResultRef : null}
          >
            <SpotifyEmbed uri={result} />
          </div>
        ))}
      </div>
      {isLoading && (
        <div className="text-center py-4 text-gray-600 font-semibold">
          Digging up more gems...
        </div>
      )}
    </div>
  );
}
