import { useEffect, useRef, useState } from 'react';
import { XCircleIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import * as Accordion from '@radix-ui/react-accordion';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { CategoryType, searchSpotify, formatResults } from '../../utils/discoverSearchForm';
import { CategoryLabel, AdvancedParams, FormattedResult } from '../../types/recommendations/types';
import type { User } from '../../types/user';
import type { Query } from '../../types/recommendations/types';
import { Queries } from '../Queries';

const categoryMapping: Record<CategoryLabel, CategoryType> = {
  'Songs': 'track',
  'Artists': 'artist',
  'Genres': 'genre'
};

export function MobileSearchForm({
  user, 
  getAccessToken, 
  sidebarMode, 
  setSidebarMode,
  category, 
  inputValue,
  suggestions,
  setSuggestions,
  handleCategoryChange,
  handleInputChange,
  handleSelection, 
  clearInput,
  handleSubmit,
  handleParamToggle,
  handleParamChange,
  getSliderValue,
  formatParamValue,
  handleRemoveSelection,
  handleSaveQuery,
  handleSelectQuery,
  handleSwitchToSearch,
  selections,
  advancedParams,
  savedQueries,
  hoveredParam,
  setHoveredParam,
} : { 
  user: User | null, 
  getAccessToken: () => Promise<string | null>, 
  sidebarMode: 'search' | 'playlists' | 'queries', 
  setSidebarMode: (mode: 'search' | 'playlists' | 'queries') => void,
  category: CategoryLabel,
  inputValue: string,
  suggestions: FormattedResult[],
  setSuggestions: (suggestions: FormattedResult[]) => void,
  handleCategoryChange: (category: CategoryLabel) => void,
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleSelection: (item: FormattedResult) => void,
  clearInput: () => void,
  handleSubmit: (e: React.FormEvent) => void,
  handleParamToggle: (param: string) => void,
  handleParamChange: (param: string, newValues: number[]) => void,
  getSliderValue: (param: string, values: AdvancedParams[keyof AdvancedParams]) => number[],
  formatParamValue: (param: string, value: number) => string,
  handleRemoveSelection: (item: FormattedResult) => void,
  handleSaveQuery: () => void,
  handleSelectQuery: (query: Query) => void,
  handleSwitchToSearch: () => void,
  selections: FormattedResult[],
  advancedParams: AdvancedParams,
  savedQueries: Query[],
  hoveredParam: string | null,
  setHoveredParam: (param: string | null) => void,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const prevInputValueRef = useRef('');
  const prevCategoryRef = useRef<CategoryLabel>('Songs');

  useEffect(() => {
    if (inputValue !== prevInputValueRef.current || category !== prevCategoryRef.current) {
      const timer = setTimeout(() => {
        if (inputValue) {
          const apiCategory = categoryMapping[category];
          searchSpotify(inputValue, apiCategory, getAccessToken)
            .then(results => setSuggestions(formatResults(results, category)));
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [inputValue, category, getAccessToken, setSuggestions]);

  useEffect(() => {
    prevInputValueRef.current = inputValue;
    prevCategoryRef.current = category;
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExpanded(false);
    handleSubmit(e);
  };

  return (
    <div className="bg-bg-primary text-text-primary w-full h-full flex-shrink-0 overflow-y-auto flex flex-col z-40 relative p-4 mb-4 rounded-lg shadow-lg">
      <div className="border-b border-border pb-4 mb-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-2 text-center">Control Panel</h2>
        <div className="flex justify-around">
          <button
            onClick={() => setSidebarMode('search')}
            className={`px-3 py-1 text-xs rounded-md min-w-[80px] ${
              sidebarMode === 'search' ? 'bg-button-primary text-button-text' : 'bg-button-secondary text-text-primary hover:bg-button-primary hover:text-button-text'
            }`}
          >
            Search
          </button>
          <div className="relative group">
            <button
              onClick={() => setSidebarMode('playlists')}
              className={`px-3 py-1 text-xs rounded-md min-w-[80px] ${
                sidebarMode === 'playlists' ? 'bg-button-primary text-button-text' : 'bg-button-secondary text-text-primary hover:bg-button-primary hover:text-button-text'
              } ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={!user}
            >
              Playlists
            </button>
            {!user && (
              <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Log in to access playlists
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-b-gray-800"></div>
              </div>
            )}
          </div>
          <div className="relative group">
            <button
              onClick={() => setSidebarMode('queries')}
              className={`px-3 py-1 text-xs rounded-md min-w-[80px] ${
                sidebarMode === 'queries' ? 'bg-button-primary text-button-text' : 'bg-button-secondary text-text-primary hover:bg-button-primary hover:text-button-text'
              } ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={!user}
            >
              Queries
            </button>
            {!user && (
              <div className="absolute z-50 top-full right-0 mt-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Log in to access saved queries
                <div className="absolute bottom-full right-4 transform translate-x-1/2 border-8 border-transparent border-b-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center py-2 bg-button-secondary text-text-primary hover:bg-button-primary hover:text-button-text rounded-md mb-4"
      >
        {isExpanded ? (
          <>
            Collapse <ChevronUpIcon className="w-5 h-5 ml-2" />
          </>
        ) : (
          <>
            Expand <ChevronDownIcon className="w-5 h-5 ml-2" />
          </>
        )}
      </button>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {sidebarMode === 'search' && (
            <div className="flex-1 overflow-y-auto">
              <h2 className="text-lg text-center font-semibold">Chart Your Course</h2>
              <p className="text-sm text-center mb-2 text-text-secondary">Select up to any 5 of the following</p>
              <div className="flex justify-center mb-2">
                {(['Songs', 'Artists', 'Genres'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleCategoryChange(tab)}
                    className={`px-3 py-1 text-sm ${
                      category === tab
                        ? 'bg-button-primary text-button-text'
                        : 'bg-button-secondary text-text-primary hover:bg-button-primary hover:text-button-text'
                    } rounded-md mr-1`}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-input-bg text-input-text border border-input-border rounded-md shadow-sm focus:outline-none focus:ring-button-primary focus:border-button-primary"
                  placeholder={`Search ${category}...`}
                />
                {inputValue && (
                  <button
                    onClick={clearInput}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    type="button"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              {inputValue && suggestions.length > 0 && (
                <ul className="mt-1 max-h-60 overflow-auto bg-bg-primary border border-border rounded-md shadow-sm mb-4">
                  {suggestions.map((item) => (
                    <button
                      key={item.id} 
                      className="w-full px-3 py-2 hover:bg-bg-secondary cursor-pointer flex items-center text-left"
                      onClick={() => handleSelection(item)}
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-8 h-8 mr-2 rounded-full flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{item.name}</div>
                        {item.artistName && <div className="text-sm text-text-secondary truncate">{item.artistName}</div>}
                      </div>
                    </button>
                  ))}
                </ul>
              )}
              <div className="mb-4">
                <h3 className="text-md text-center font-semibold mb-2">Selected Coordinates</h3>
                {selections.length ? ['Songs', 'Artists', 'Genres'].map((categoryLabel) => {
                  const categorySelections = selections.filter((item) => {
                    if (categoryLabel === 'Songs') return 'artistName' in item;
                    if (categoryLabel === 'Artists') return !('artistName' in item) && item.imageUrl;
                    return !('artistName' in item) && !item.imageUrl;
                  });
    
                  if (categorySelections.length === 0) return null;
    
                  return (
                    <div key={categoryLabel} className="mb-2">
                      <h4 className="text-sm font-semibold text-text-secondary mb-1">{categoryLabel}</h4>
                      {categorySelections.map((item) => (
                        <div key={item.id} className={`flex items-center justify-between bg-bg-secondary p-2 rounded-md mb-1 ${
                          categoryLabel === 'Songs' ? 'border-l-4 border-blue-500' :
                          categoryLabel === 'Artists' ? 'border-l-4 border-green-500' :
                          'border-l-4 border-purple-500'
                        }`}>
                          <div className="flex items-center min-w-0 flex-1">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.name} className="w-6 h-6 mr-2 rounded-full flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{item.name}</div>
                              {'artistName' in item && (
                                <div className="text-sm text-text-secondary truncate">{item.artistName}</div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSelection(item)}
                            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }) : (
                  <p className="text-center text-text-secondary">No selections yet. Start by searching above!</p>
                )}
              </div>
              <Accordion.Root type="single" collapsible className="mb-4">
                <Accordion.Item value="advanced-params">
                  <Accordion.Trigger className="flex items-center justify-center w-full text-left py-2 px-4 bg-bg-secondary hover:bg-bg-hover rounded-md">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Advanced Parameters
                    <svg className="w-4 h-4 ml-2 transition-transform duration-200 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Accordion.Trigger>
                  <Accordion.Content className="pt-2">
                    {Object.entries(advancedParams).map(([param, values]) => (
                      <div key={param} className="mb-4">
                        <div className="flex items-center justify-between">
                          <label htmlFor={param} className="text-sm font-medium">
                            {param.charAt(0).toUpperCase() + param.slice(1)}
                          </label>
                          <div 
                            className="relative"
                            onMouseEnter={() => !user && setHoveredParam(param)}
                            onMouseLeave={() => setHoveredParam(null)}
                          >
                            <Switch.Root
                              id={param}
                              disabled={!user}
                              checked={values.enabled}
                              onCheckedChange={() => handleParamToggle(param)}
                              className="w-9 h-5 bg-gray-200 rounded-full relative shadow-inner"
                            >
                              <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow absolute top-0.5 left-0.5 transition-transform duration-100 transform" />
                            </Switch.Root>
                            {!user && hoveredParam === param && (
                              <div className="absolute z-50 bottom-full right-0 mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-md whitespace-nowrap">
                                Log in to enable advanced parameters
                                <div className="absolute top-full right-2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-800"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        {values.enabled && (
                          <div className="mt-2">
                            <Slider.Root
                              min={0}
                              max={100}
                              step={1}
                              value={getSliderValue(param, values)}
                              onValueChange={(newValues) => handleParamChange(param, newValues)}
                              className="relative flex items-center select-none touch-none w-full h-5"
                            >
                              <Slider.Track className="bg-slider-bg relative grow rounded-full h-1">
                                <Slider.Range className="absolute bg-slider-fill rounded-full h-full" />
                              </Slider.Track>
                              {param === 'mode' ? (
                                <Slider.Thumb 
                                  className={`block w-5 h-5 shadow-md rounded-full focus:outline-none focus:ring-2 ${
                                    values.enabled
                                      ? 'bg-button-text hover:bg-button-primary focus:ring-button-primary'
                                      : 'bg-gray-400 cursor-not-allowed'
                                  }`} 
                                />
                              ) : (
                                <>
                                  {[0, 1, 2].map((index) => (
                                    <Slider.Thumb 
                                      key={index}
                                      className={`block w-5 h-5 shadow-md rounded-full focus:outline-none focus:ring-2 ${
                                        values.enabled
                                          ? 'bg-button-text hover:bg-button-primary focus:ring-button-primary'
                                          : 'bg-gray-400 cursor-not-allowed'
                                      }`} 
                                    />
                                  ))}
                                </>
                              )}
                            </Slider.Root>
                            <div className="flex justify-between text-xs text-text-secondary mt-1">
                              {param === 'mode' ? (
                                <>
                                  <span>Minor</span>
                                  <span>Major</span>
                                </>
                              ) : (
                                <>
                                  <span>{formatParamValue(param, values.min as number)}</span>
                                  <span>{formatParamValue(param, values.target)}</span>
                                  <span>{formatParamValue(param, values.max as number)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
              <div className="relative mb-2">
                <button
                  onClick={handleSaveQuery}
                  className={`mt-4 w-full px-4 py-2 rounded transition-colors ${
                    user
                      ? 'bg-blue-500 text-button-text hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed group'
                  }`}
                  disabled={!user}
                >
                  Save Query
                  {!user && (
                    <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Log in to save queries
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </button>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full mx-auto block bg-button-primary text-button-text px-4 py-2 rounded-md hover:opacity-90 transition-colors"
                  onClick={onSubmit}
                >
                  Start Digging
                </button>
              </div>
            </div>
          )}
          
          {sidebarMode === 'playlists' && (
            <div className="flex-1 overflow-y-auto">
              <h2 className="text-lg text-center font-semibold">Playlists</h2>
              <p className="text-center text-text-secondary mt-4">Playlist functionality coming soon!</p>
            </div>
          )}
          
          {sidebarMode === 'queries' && (
            <Queries queries={savedQueries} onSelectQuery={handleSelectQuery} onSwitchToSearch={handleSwitchToSearch} />
          )}
        </div>
      )}
    </div>
  );
}
