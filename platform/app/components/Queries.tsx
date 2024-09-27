import { useState, useRef, useEffect } from 'react';
import { Query } from '../types/recommendations/types';
import { Tooltip } from './Tooltip';
import { getRandomColor } from '../utils/forms';
import { useQueries } from '../hooks/useQueries';

interface QueriesProps {
  onSelectQuery: (query: Query) => void;
  onSwitchToSearch: () => void;
  isLoading: boolean;
}

export function Queries({ onSelectQuery, onSwitchToSearch }: QueriesProps) {
  const { savedQueries, loadQueries, isLoading, error } = useQueries();
  const [hoveredQueryId, setHoveredQueryId] = useState<string | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const colorRefs = useRef<{ [key: string]: string }>({});
  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    // Generate colors for each query once when the component mounts or queries change
    savedQueries.forEach((query) => {
      if (!colorRefs.current[query.id]) {
        colorRefs.current[query.id] = getRandomColor();
      }
    });
  }, [savedQueries]);

  if (isLoading) {
    return <div className="p-4">Loading saved queries...</div>;
  }

  if (error) {
    return <div className="p-4">Error loading saved queries: {error}</div>;
  }

  if (!savedQueries || savedQueries.length === 0) {
    return (
      <>
        <div className="px-4 pt-4 pb-2 text-center text-gray-500">
          Your saved search queries will appear here.
        </div>
        <div className="px-4 py-4 text-center">
          <button
            onClick={onSwitchToSearch}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Start Digging
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg text-center font-semibold mb-4">Saved Queries</h2>
      <div className="flex flex-col space-y-2">
        {savedQueries.map((query) => (
          <div 
            key={query.id} 
            className="relative"
            onMouseEnter={() => setHoveredQueryId(query.id)}
            onMouseLeave={() => setHoveredQueryId(null)}
          >
            <button 
              ref={(el) => buttonRefs.current[query.id] = el}
              className={`w-full px-4 py-2 rounded-full text-sm text-white text-center font-medium transition-colors ${colorRefs.current[query.id]} text-left`}
              onClick={() => onSelectQuery(query)}
            >
              <span className="truncate block">{query.name}</span>
            </button>
            {hoveredQueryId === query.id && (
              <Tooltip 
                text="Revisit this search"
                targetRect={buttonRefs.current[query.id]?.getBoundingClientRect() || null}
                position="right"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
