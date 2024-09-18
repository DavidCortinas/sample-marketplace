import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from '@remix-run/react'; 
import * as Accordion from '@radix-ui/react-accordion';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { useSpotify } from '../hooks/useSpotify';
import { Queries } from './Queries';
import { saveQuery } from '../api/queries';
import { CategoryLabel, AdvancedParams, FormattedResult, Query } from '../types/recommendations/types';
import { fetchGenres } from '../api/genres';

type CategoryType = 'track' | 'artist' | 'genre';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    images: { url: string }[];
  };
  href: string;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
}

const categoryMapping: Record<CategoryLabel, CategoryType> = {
  'Songs': 'track',
  'Artists': 'artist',
  'Genres': 'genre'
};

export default function DiscoverSidebar() {
  const { getAccessToken } = useSpotify();
  const [selections, setSelections] = useState<FormattedResult[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<FormattedResult[]>([]);
  const [category, setCategory] = useState<CategoryLabel>('Songs');
  const prevInputValueRef = useRef('');
  const prevCategoryRef = useRef<CategoryLabel>('Songs');
  const [advancedParams, setAdvancedParams] = useState<AdvancedParams>({
    acousticness: { enabled: false, min: 0, target: 50, max: 100 },
    danceability: { enabled: false, min: 0, target: 50, max: 100 },
    energy: { enabled: false, min: 0, target: 50, max: 100 },
    instrumentalness: { enabled: false, min: 0, target: 50, max: 100 },
    key: { enabled: false, min: 0, target: 6, max: 11 },
    duration_ms: { enabled: false, min: 30000, target: 180000, max: 3600000 },
    liveness: { enabled: false, min: 0, target: 50, max: 100 },
    loudness: { enabled: false, min: -60, target: -30, max: 0 },
    mode: { enabled: false, target: 0 },
    popularity: { enabled: false, min: 0, target: 50, max: 100 },
    speechiness: { enabled: false, min: 0, target: 50, max: 100 },
    tempo: { enabled: false, min: 0, target: 150, max: 300 },
    time_signature: { enabled: false, min: 1, target: 4, max: 7 },
    valence: { enabled: false, min: 0, target: 50, max: 100 },
  });

  const navigate = useNavigate();

  const searchSpotify = useCallback(async (query: string, type: CategoryType) => {
    const accessToken = await getAccessToken();
    if (type === 'genre') {
      const genres = await fetchGenres(accessToken);
      return genres.filter((genre: string) => genre.toLowerCase().includes(query.toLowerCase()));
    } else {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      return type === 'track' ? data.tracks.items : data.artists.items;
    }
  }, [getAccessToken]);

  const formatResults = (results: (string | SpotifyTrack | SpotifyArtist)[], category: CategoryLabel): FormattedResult[] => {
    if (category === 'Genres') {
      return (results as string[]).map(genre => ({ id: genre, name: genre, imageUrl: '' }));
    } else if (category === 'Songs') {
      return (results as SpotifyTrack[]).map(track => ({
        id: track.id,
        name: track.name,
        imageUrl: track.album.images[2]?.url || '',
        artistName: track.artists[0]?.name
      }));
    } else {
      return (results as SpotifyArtist[]).map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images[2]?.url || ''
      }));
    }
  };

  useEffect(() => {
    if (inputValue !== prevInputValueRef.current || category !== prevCategoryRef.current) {
      const timer = setTimeout(() => {
        if (inputValue) {
          const apiCategory = categoryMapping[category];
          searchSpotify(inputValue, apiCategory)
            .then(results => setSuggestions(formatResults(results, category)));
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [inputValue, category, searchSpotify]);

  useEffect(() => {
    prevInputValueRef.current = inputValue;
    prevCategoryRef.current = category;
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.length === 0) {
      setSuggestions([]);
    }
  }, []);

  const handleSelection = (item: FormattedResult) => {
    if (selections.length < 5 && !selections.some(selection => selection.id === item.id)) {
      setSelections([...selections, item]);
      setInputValue('');
      setSuggestions([]);
    }
  };

  const handleRemoveSelection = (item: FormattedResult) => {
    setSelections(selections.filter(selection => selection.id !== item.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare seed parameters
    const seedArtists = selections
      .filter(item => !('artistName' in item) && item.imageUrl)
      .map(item => item.id)
      .join(',');
    
    const seedTracks = selections
      .filter(item => 'artistName' in item)
      .map(item => item.id)
      .join(',');
    
    const seedGenres = selections
      .filter(item => !('artistName' in item) && !item.imageUrl)
      .map(item => item.id)
      .join(',');

    // Prepare advanced parameters
    const advancedParamsFormatted = Object.entries(advancedParams).reduce((acc, [key, value]) => {
      if (value.enabled) {
        if ('min' in value && value.min !== undefined) acc[`min_${key}`] = value.min;
        if ('max' in value && value.max !== undefined) acc[`max_${key}`] = value.max;
        acc[`target_${key}`] = value.target;
      }
      return acc;
    }, {} as Record<string, number>);

    // Construct query string
    const queryParams = new URLSearchParams({
      seed_artists: seedArtists,
      seed_tracks: seedTracks,
      seed_genres: seedGenres,
      limit: '100', // You can make this dynamic if needed
      ...advancedParamsFormatted
    });

    try {
      const response = await fetch(`http://localhost:8000/api/spotify/recommendations/?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      // Navigate to the discover route with the results
      navigate(`/discover`, { 
        state: { recommendations: data.track_uris },
        replace: true
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // TODO: Handle error (e.g., display error message to user)
    }
  };

  const handleCategoryChange = async (newCategory: CategoryLabel) => {
    setCategory(newCategory);
    setInputValue('');
    setSuggestions([]);
    if (newCategory === 'Genres') {
      try {
        const accessToken = await getAccessToken();
        const genres = await fetchGenres(accessToken);
        setSuggestions(formatResults(genres, 'Genres'));
      } catch (error) {
        console.error('Error fetching genres:', error);
        // Handle error (e.g., show error message to user)
      }
    }
  };

  const handleParamToggle = (param: string) => {
    setAdvancedParams(prev => ({
      ...prev,
      [param]: { ...prev[param], enabled: !prev[param].enabled }
    }));
  };

  const handleParamChange = useCallback((param: string, newValues: number[]) => {
    setAdvancedParams((prev) => {
      if (param === 'mode') {
        return { ...prev, [param]: { ...prev[param], target: Math.round(newValues[0]) } };
      } else {
        const [min, target, max] = newValues.map(v => denormalizeValue(param, v));
        return {
          ...prev,
          [param]: {
            ...prev[param],
            min: Math.min(min, target, max),
            target: Math.max(min, Math.min(target, max)),
            max: Math.max(min, target, max),
          },
        };
      }
    });
  }, []);

  const getSliderValue = useCallback((param: string, values: AdvancedParams[string]) => {
    if (param === 'mode') {
      return [values.target];
    }
    return [
      normalizeValue(param, values.min as number),
      normalizeValue(param, values.target),
      normalizeValue(param, values.max as number),
    ];
  }, []);

  const normalizeValue = (param: string, value: number): number => {
    const { min, max } = advancedParams[param];
    return ((value - (min || 0)) / ((max || 100) - (min || 0))) * 100;
  };

  const denormalizeValue = (param: string, normalizedValue: number): number => {
    const { min, max } = advancedParams[param];
    return (min || 0) + (normalizedValue / 100) * ((max || 100) - (min || 0));
  };

  const formatParamValue = (param: string, value: number): string => {
    switch (param) {
      case 'duration_ms':
        return formatTime(value / 1000);
      case 'loudness':
        return `${value.toFixed(1)} dB`;
      case 'key':
        return ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'][Math.round(value)];
      case 'mode':
        return value < 0.5 ? 'Minor' : 'Major';
      case 'tempo':
        return `${value.toFixed(0)} BPM`;
      case 'time_signature':
        return `${Math.round(value)}/4`;
      default:
        return value.toFixed(2);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
  };

  const [sidebarMode, setSidebarMode] = useState<'search' | 'playlists' | 'queries'>('search');
  const [savedQueries, setSavedQueries] = useState<Query[]>([]);
  
  const handleSaveQuery = async () => {
    const queryName = prompt('Enter a name for this query:');
    if (queryName) {
      const newQuery: Query = {
        id: Date.now().toString(), // This will be replaced by the backend
        name: queryName,
        parameters: {
          selections,
          advancedParams,
        }
      };

      try {
        const savedQuery = await saveQuery(newQuery);
        setSavedQueries(prevQueries => [...prevQueries, savedQuery]);
        alert('Query saved successfully!');
      } catch (error) {
        console.error('Error saving query:', error);
        alert('Failed to save query. Please try again.');
      }
    }
  };

  const handleSelectQuery = (query: Query) => {
    // Implement logic to populate the search form with the selected query
    setSelections(query.parameters.selections);
    setCategory(query.parameters.category);
    setAdvancedParams(query.parameters.advancedParams);
    // Set any other relevant parameters
    setSidebarMode('search');
  };

  const handleSwitchToSearch = () => {
    setSidebarMode('search');
  };

  return (
    <div className="bg-white w-64 h-screen flex-shrink-0 border-r border-gray-200 overflow-y-auto flex flex-col">
      <div className="p-2 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 mb-1 text-center">Control Panel</h2>
        <div className="flex justify-between">
          <button
            onClick={() => setSidebarMode('search')}
            className={`px-3 py-1 text-xs rounded-md ${
              sidebarMode === 'search' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setSidebarMode('playlists')}
            className={`px-3 py-1 text-xs rounded-md ${
              sidebarMode === 'playlists' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setSidebarMode('queries')}
            className={`px-3 py-1 text-xs rounded-md ${
              sidebarMode === 'queries' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Queries
          </button>
        </div>
      </div>
      
      {sidebarMode === 'search' && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg text-center font-semibold">Chart Your Course</h2>
            <p className="text-sm text-center mb-2">Select up to any 5 of the following</p>
            <div className="flex justify-center mb-2">
              {(['Songs', 'Artists', 'Genres'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleCategoryChange(tab)}
                  className={`px-3 py-1 text-sm ${
                    category === tab
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } rounded-md mr-1`}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder={`Search ${category}...`}
              />
              {inputValue && (
                <button
                  onClick={clearInput}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            {inputValue && suggestions.length > 0 && (
              <ul className="mt-1 max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-sm">
                {suggestions.map((item) => (
                  <button
                    key={item.id} 
                    className="w-full px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-left"
                    onClick={() => handleSelection(item)}
                  >
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-8 h-8 mr-2 rounded-full flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{item.name}</div>
                      {item.artistName && <div className="text-sm text-gray-500 truncate">{item.artistName}</div>}
                    </div>
                  </button>                ))}
              </ul>
            )}
            <div className="mt-4">
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
                    <h4 className="text-sm font-semibold text-gray-600 mb-1">{categoryLabel}</h4>
                    {categorySelections.map((item) => (
                      <div key={item.id} className={`flex items-center justify-between bg-gray-100 p-2 rounded-md mb-1 ${
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
                              <div className="text-sm text-gray-500 truncate">{item.artistName}</div>
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
                <p className="text-sm text-center">Select up to five of any songs, artists, or genres to triangulate your search and use the advanced parameters to fine-tune the results.</p>
              )}
            </div>
          </div>
          <Accordion.Root type="single" collapsible className="">
            <Accordion.Item value="advanced-params">
              <Accordion.Trigger className="flex items-center justify-center w-full py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Advanced Parameters
                <svg className="w-4 h-4 ml-2 transition-transform duration-200 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Accordion.Trigger>
              <Accordion.Content className="pt-2 pb-4">
                {Object.entries(advancedParams).map(([param, values]) => (
                  <div key={param} className="mb-4">
                    <div className="flex items-center justify-between px-6">
                      <label className="text-sm font-medium text-gray-700">
                        {param === 'duration_ms' ? 'Duration' : param === 'time_signature' ? 'Time Signature' : param === 'valence' ? 'Positiveness' : param.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <Switch.Root
                        checked={values.enabled}
                        onCheckedChange={() => handleParamToggle(param)}
                        className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-orange-500 transition-colors"
                      >
                        <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
                      </Switch.Root>
                    </div>
                    {values.enabled && (
                      <div className="mt-2 px-4">
                        <Slider.Root
                          min={0}
                          max={100}
                          step={1}
                          value={getSliderValue(param, values)}
                          onValueChange={(newValues) => handleParamChange(param, newValues)}
                          className="relative flex items-center select-none touch-none w-full h-5"
                        >
                          <Slider.Track className="bg-gray-200 relative grow rounded-full h-1">
                            <Slider.Range className="absolute bg-orange-500 rounded-full h-full" />
                          </Slider.Track>
                          {param === 'mode' ? (
                            <Slider.Thumb className="block w-5 h-5 bg-white shadow-md rounded-full hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                          ) : (
                            <>
                              <Slider.Thumb className="block w-5 h-5 bg-white shadow-md rounded-full hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                              <Slider.Thumb className="block w-5 h-5 bg-white shadow-md rounded-full hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                              <Slider.Thumb className="block w-5 h-5 bg-white shadow-md rounded-full hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                            </>
                          )}
                        </Slider.Root>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
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
          <div className="px-4 mb-2">
            <button
              onClick={handleSaveQuery}
              className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Save Query
            </button>
          </div>
          <div className="px-4">
            <button
              type="submit"
              className="w-full mx-auto block bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
              onClick={handleSubmit}
            >
              Start Digging
            </button>
          </div>
        </div>
      )}
      
      {sidebarMode === 'playlists' && (
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-lg text-center font-semibold">Playlists</h2>
          <p className="text-center text-gray-500 mt-4">Playlist functionality coming soon!</p>
        </div>
      )}
      
      {sidebarMode === 'queries' && (
        <Queries queries={savedQueries} onSelectQuery={handleSelectQuery} onSwitchToSearch={handleSwitchToSearch} />
      )}
    </div>
  );
}
