import { useState, useRef } from 'react';
import { Query } from '../types/recommendations/types';
import { Tooltip } from './Tooltip';

interface QueriesProps {
  queries: Query[];
  onSelectQuery: (query: Query) => void;
  onSwitchToSearch: () => void;
}

export function Queries({ queries, onSelectQuery, onSwitchToSearch }: QueriesProps) {
  const [hoveredQueryId, setHoveredQueryId] = useState<string | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  if (queries.length === 0) {
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
        {queries.map((query) => (
          <div 
            key={query.id} 
            className="relative"
            onMouseEnter={() => setHoveredQueryId(query.id)}
            onMouseLeave={() => setHoveredQueryId(null)}
          >
            <button 
              ref={(el) => buttonRefs.current[query.id] = el}
              className="w-full px-4 py-2 rounded-full text-sm font-medium transition-colors bg-orange-100 text-orange-700 hover:bg-orange-200 text-left"
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
