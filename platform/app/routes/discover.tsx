import { Outlet, useLocation, useNavigate, useLoaderData } from "@remix-run/react";
import { useState, useEffect, useCallback } from "react";
import DiscoverHeader from "../components/Discover/DiscoverHeader";
import DiscoverSidebar from "../components/Discover/DiscoverSidebar";
import { MusicGrid } from "../components/Discover/MusicGrid";
import { LoaderFunction, json } from "@remix-run/node";
import { getAccessToken } from "../utils/auth.server";
import { MobileSearchForm } from "../components/Discover/MobileSearchForm";
import { useSpotify } from "../hooks/useSpotify";
import { FormattedResult, CategoryLabel, AdvancedParams } from "../types/recommendations/types";
import { 
  handleCategoryChange, 
  handleInputChange, 
  handleSelection, 
  handleSubmit, 
  handleParamToggle, 
  handleParamChange, 
  getSliderValue, 
  formatParamValue, 
  handleRemoveSelection, 
  handleSelectQuery, 
  handleSwitchToSearch, 
  resetSearch 
} from "../utils/discoverSearchForm";
import { useQueries } from "../hooks/useQueries";
import { Playlist } from "../types/playlists/types";
import { User } from "../types/user";
import { getSession, commitSession } from "../session.server";
import { usePlaylists } from "../hooks/usePlaylists";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);

  let accessToken = null;
  const playlists: Playlist[] = [];
  let accessTokenError = null;
  const playlistsError = null;

  // Fetch access token
  try {
    accessToken = await getAccessToken(request);
  } catch (error) {
    console.error('Error fetching access token:', error);
    accessTokenError = 'Failed to fetch access token';
  }

  // Fetch playlists if we have an access token
  // if (accessToken) {
  //   try {
  //     playlists = await fetchPlaylists(accessToken);
  //     // playlists = []
  //   } catch (error) {
  //     console.error('Error fetching playlists:', error);
  //     playlistsError = 'Failed to fetch playlists';
  //   }
  // }

  const user = session.get("user");

  return json({
    accessToken,
    accessTokenError,
    playlists,
    playlistsError,
    user
  }, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

export default function Discover() {
  const { 
    accessToken, 
    user
  } = useLoaderData<{ 
    accessToken: string, 
    accessTokenError: string, 
    playlistsError: string, 
    user: User 
  }>();

  const location = useLocation();
  const navigate = useNavigate();
  
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);


  // SEARCH FORM STATE
  const { getSpotifyAccessToken } = useSpotify();
  const [selections, setSelections] = useState<FormattedResult[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<FormattedResult[]>([]);
  const [category, setCategory] = useState<CategoryLabel>('Songs');
  const [hoveredParam, setHoveredParam] = useState<string | null>(null);
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
  const [sidebarMode, setSidebarMode] = useState<'search' | 'playlists' | 'queries'>('search');

  const { 
    loadQueries, 
    selectQuery, 
    selectedQuery, 
    savedQueries, 
    queriesError, 
    saveNewQuery 
  } = useQueries();

  const {
    savedPlaylists,
    selectedPlaylist,
    loadPlaylists,
    selectPlaylist,
    isLoadingPlaylists,
    error
  } = usePlaylists();
  console.log('selectedPlaylist', selectedPlaylist?.tracks.items);

  useEffect(() => {
    if (user) {
      loadQueries();
      loadPlaylists();
    }
  }, [user, loadQueries, loadPlaylists]);


  useEffect(() => {
    if (selectedQuery) {
      setSelections(selectedQuery.parameters.selections.map(selection => ({
        ...selection,
        type: selection.type || (selection.artistName ? 'track' : selection.imageUrl ? 'artist' : 'genre'),
        artistName: selection.artistName || '',
        imageUrl: selection.imageUrl || '',
      })));
      setCategory(selectedQuery.parameters.category);
      setAdvancedParams(selectedQuery.parameters.advancedParams);
      setRecommendations(selectedQuery.recommendations);
      setIsInitialLoad(false);
      
      setSidebarMode('search');
    }
  }, [selectedQuery]);

  console.log(selectedQuery)
  console.log(recommendations)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Adjust this breakpoint as needed
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  useEffect(() => {
    if (location.state?.recommendations) {
      setRecommendations(location.state.recommendations);
      setIsInitialLoad(false);
    }
  }, [location.state?.recommendations]);

  const clearResults = useCallback(() => {
    setRecommendations([]);
    setIsInitialLoad(true);
    setHasMore(true);
  }, []);

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
  };

  const loadMoreResults = useCallback(() => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    // Simulate loading more results
    setTimeout(() => {
      setRecommendations(prev => {
        const newRecommendations = [...prev, ...Array(5).fill('').map(() => `spotify:track:${Math.random().toString(36).substr(2, 9)}`)];
        if (newRecommendations.length >= 100) {
          setHasMore(false);
        }
        return newRecommendations.slice(0, 100); // Ensure we never exceed 100 results
      });
      setIsLoading(false);
      setIsInitialLoad(false);
    }, 1000);
  }, [hasMore, isLoading]);

  const handleReset = useCallback(() => {
    resetSearch(setSelections, setCategory, setInputValue, setSuggestions, setAdvancedParams);
  }, [setSelections, setCategory, setInputValue, setSuggestions, setAdvancedParams]);

  // const handleSaveQueryWrapper = useCallback(() => {
  //   handleSaveQuery(selections, category, advancedParams, saveNewQuery);
  // }, [selections, category, advancedParams, saveNewQuery]);
  console.log('recommendations', recommendations);

  return (
    <div className="flex flex-col h-screen bg-gray-100 md:flex-row">

      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0">
        <DiscoverSidebar 
          user={user}
          getSpotifyAccessToken={getSpotifyAccessToken}
          sidebarMode={sidebarMode}
          setSidebarMode={setSidebarMode}
          category={category}
          inputValue={inputValue}
          suggestions={suggestions}
          setSuggestions={setSuggestions}
          handleCategoryChange={(newCategory) => handleCategoryChange(newCategory, setCategory, setInputValue, setSuggestions)}
          handleInputChange={(e) => handleInputChange(e, setInputValue, setSuggestions)}
          handleSelection={(item) => handleSelection(item, selections, setSelections, setInputValue, setSuggestions)}
          clearInput={clearInput}
          clearResults={clearResults}
          handleSubmit={(e) => handleSubmit(e, selections, advancedParams, setCategory, setInputValue, setSuggestions, navigate)}
          handleParamToggle={(param) => handleParamToggle(param as keyof AdvancedParams, setAdvancedParams)}
          handleParamChange={(param, newValues) => handleParamChange(param as keyof AdvancedParams, newValues, advancedParams, setAdvancedParams)}
          getSliderValue={(param, values) => getSliderValue(param as keyof AdvancedParams, values)}
          formatParamValue={(param, value) => formatParamValue(param as keyof AdvancedParams, value)}
          handleRemoveSelection={(item) => handleRemoveSelection(item, selections, setSelections)}
          // handleSaveQuery={handleSaveQueryWrapper}
          handleSelectQuery={selectQuery}
          handleSwitchToSearch={() => handleSwitchToSearch(setSidebarMode)}
          selections={selections}
          advancedParams={advancedParams}
          // savedQueries={savedQueries}
          isLoadingQueries={isLoadingQueries}
          hoveredParam={hoveredParam}
          setHoveredParam={setHoveredParam} 
          handleReset={handleReset}
          // playlists={playlists}
          accessToken={accessToken}
          recommendations={recommendations}
          savedPlaylists={savedPlaylists}
          selectPlaylist={selectPlaylist}
          isLoadingPlaylists={isLoadingPlaylists}
          error={error}
          selectedPlaylist={selectedPlaylist}
          savedQueries={savedQueries}
          queriesError={queriesError}
          saveNewQuery={saveNewQuery}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DiscoverHeader user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto map-background map-overlay">
          <div className="container mx-auto px-6 py-8 h-3/4">
            {/* Mobile search form - visible on mobile */}
            <div className="md:hidden">
              <MobileSearchForm
                user={user}
                getSpotifyAccessToken={getSpotifyAccessToken}
                sidebarMode={sidebarMode}
                setSidebarMode={setSidebarMode}
                category={category}
                inputValue={inputValue}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
                handleCategoryChange={(newCategory) => handleCategoryChange(newCategory, setCategory, setInputValue, setSuggestions)}
                handleInputChange={(e) => handleInputChange(e, setInputValue, setSuggestions)}
                handleSelection={(item) => handleSelection(item, selections, setSelections, setInputValue, setSuggestions)}
                clearInput={clearInput}
                handleSubmit={(e) => handleSubmit(e, selections, advancedParams, setCategory, setInputValue, setSuggestions, navigate)}
                handleParamToggle={(param) => handleParamToggle(param as keyof AdvancedParams, setAdvancedParams)}
                handleParamChange={(param, newValues) => handleParamChange(param as keyof AdvancedParams, newValues, advancedParams, setAdvancedParams)}
                getSliderValue={(param, values) => getSliderValue(param as keyof AdvancedParams, values)}
                formatParamValue={(param, value) => formatParamValue(param as keyof AdvancedParams, value)}
                handleRemoveSelection={(item) => handleRemoveSelection(item, selections, setSelections)}
                // handleSaveQuery={handleSaveQueryWrapper}
                handleSelectQuery={(query) => handleSelectQuery(query, setSelections, setCategory, setAdvancedParams, setSidebarMode)}
                handleSwitchToSearch={() => handleSwitchToSearch(setSidebarMode)}
                selections={selections}
                advancedParams={advancedParams}
                // savedQueries={savedQueries}
                hoveredParam={hoveredParam}
                setHoveredParam={setHoveredParam} 
                handleReset={handleReset}
                isLoadingQueries={isLoadingQueries}
              />
            </div>
            {isInitialLoad ? (
              <div className="flex justify-center items-start my-12 md:items-center h-full">
                <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-4 rounded-lg shadow-md max-w-md w-full text-white">
                  <h2 className="text-2xl font-bold mb-4">Ready to Discover?</h2>
                  <p className="mb-6 text-orange-100">
                    {`Use the control panel ${isMobile ? 'above' : 'in the sidebar'} to start digging up musical gems! Adjust your preferences and watch as we unearth tracks tailored just for you.`}
                  </p>
                  <div className="flex justify-center">
                    <svg className="w-12 h-12 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
                <MusicGrid 
                  isLoading={isLoading} 
                  results={recommendations} 
                  onLoadMore={loadMoreResults} 
                  isInitialLoad={isInitialLoad} 
                />
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
