import { Outlet, useLocation, useNavigate, useLoaderData } from "@remix-run/react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  handleSwitchToSearch, 
  resetSearch 
} from "../utils/discoverSearchForm";
import { useQueries } from "../hooks/useQueries";
import { Playlist } from "../types/playlists/types";
import { User } from "../types/user";
import { getSession, commitSession } from "../session.server";
import { usePlaylists } from "../hooks/usePlaylists";
import { createEmptyPlaylist } from "../utils/playlist";

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
  
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'playlist'>('recommendations');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoadingMemoizedResults, setIsLoadingMemoizedResults] = useState(false);
  const [localHasMore, setLocalHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);
  const initialLoadRef = useRef(true);


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
    selectedPlaylistTracks,
    totalPlaylists,
    limit,
    offset,
    loadPlaylists,
    loadMore,
    loadPrevious,
    selectPlaylist,
    gridSelectedPlaylist,
    gridSelectedPlaylistTracks,
    selectGridPlaylist,
    changeLimit,
    isLoadingPlaylists,
    isLoadingSelectedPlaylist,
    playlistsError,
    deletePlaylist,
    isDeletingPlaylist,
    currentPage,
    loadPage,
    removeTrackFromPlaylist,
    updatePlaylistTracks,
    clearSelectedPlaylist,
    initiateNewPlaylist,
    saveNewPlaylist,
    isEditingNewPlaylist,
    newPlaylistName,
    updateNewPlaylistName
  } = usePlaylists();

  const memoizedRecommendations = useMemo(() => recommendations, [recommendations]);

  const memoizedLoadMoreResults = useCallback(() => {
    if (!localHasMore || isLoadingMemoizedResults) return;

    setIsLoadingMemoizedResults(true);
    setTimeout(() => {
      setRecommendations(prev => {
        const newRecommendations = [...prev, ...Array(5).fill('').map(() => `spotify:track:${Math.random().toString(36).substr(2, 9)}`)];
        if (newRecommendations.length >= 100) {
          setLocalHasMore(false);
        }
        return newRecommendations.slice(0, 100);
      });
      setIsLoadingMemoizedResults(false);
    }, 1000);
  }, [localHasMore, isLoadingMemoizedResults]);

  useEffect(() => {
    if (user) {
      if (initialLoadRef.current) {
        loadQueries();
        loadPlaylists();
        initialLoadRef.current = false;
      }
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
      
      setSidebarMode('search');
    }
  }, [selectedQuery]);

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
    }
  }, [location.state?.recommendations]);

  useEffect(() => {
    if (selectedPlaylist && selectedPlaylistTracks) {
      setSelectedTab('playlist');
    }
  }, [selectedPlaylist, selectedPlaylistTracks]);

  const clearResults = useCallback(() => {
    setRecommendations([]);
    setLocalHasMore(true);
  }, []);

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
  };

  const handleReset = useCallback(() => {
    resetSearch(setSelections, setCategory, setInputValue, setSuggestions, setAdvancedParams);
  }, [setSelections, setCategory, setInputValue, setSuggestions, setAdvancedParams]);

  const onHandleSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e, selections, advancedParams, navigate);
    setSelectedTab('recommendations');
  };

  const handleGridPlaylistSelect = useCallback((playlistId: string) => {
    selectGridPlaylist(playlistId);
    setSelectedTab('playlist');
  }, [selectGridPlaylist, setSelectedTab]);

  const [showTooltip, setShowTooltip] = useState(false);
  const playlistButtonRef = useRef<HTMLDivElement>(null);

  const handleInitiateNewPlaylist = () => {
    console.log('handleInitiateNewPlaylist');
    initiateNewPlaylist(user);
  };

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
          handleSubmit={onHandleSubmit}
          handleParamToggle={(param) => handleParamToggle(param as keyof AdvancedParams, setAdvancedParams)}
          handleParamChange={(param, newValues) => handleParamChange(param as keyof AdvancedParams, newValues, advancedParams, setAdvancedParams)}
          getSliderValue={(param, values) => getSliderValue(param as keyof AdvancedParams, values)}
          formatParamValue={(param, value) => formatParamValue(param as keyof AdvancedParams, value)}
          handleRemoveSelection={(item) => handleRemoveSelection(item, selections, setSelections)}
          handleSelectQuery={selectQuery}
          handleSwitchToSearch={() => handleSwitchToSearch(setSidebarMode)}
          selections={selections}
          advancedParams={advancedParams}
          isLoadingQueries={isLoadingQueries}
          hoveredParam={hoveredParam}
          setHoveredParam={setHoveredParam} 
          handleReset={handleReset}
          accessToken={accessToken}
          recommendations={recommendations}
          savedPlaylists={savedPlaylists}
          clearSelectedPlaylist={clearSelectedPlaylist}
          selectedPlaylist={selectedPlaylist}
          totalPlaylists={totalPlaylists}
          limit={limit}
          offset={offset}
          loadMore={loadMore}
          loadPrevious={loadPrevious}
          changeLimit={changeLimit}
          deletePlaylist={deletePlaylist}
          isDeletingPlaylist={isDeletingPlaylist}
          isLoadingPlaylists={isLoadingPlaylists}
          currentPage={currentPage}
          error={playlistsError}
          savedQueries={savedQueries}
          queriesError={queriesError}
          loadPage={loadPage}
          handleInitiateNewPlaylist={handleInitiateNewPlaylist}
          isEditingNewPlaylist={isEditingNewPlaylist}
          saveNewPlaylist={saveNewPlaylist}
          newPlaylistName={newPlaylistName}
          updateNewPlaylistName={updateNewPlaylistName}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DiscoverHeader user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto map-background map-overlay">
          <div className="container mx-auto px-6 py-2 h-3/4">
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
                clearResults={clearResults}
                handleSubmit={onHandleSubmit}
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
                clearSelectedPlaylist={clearSelectedPlaylist}
                selectedPlaylist={selectedPlaylist}
                selectedPlaylistTracks={selectedPlaylistTracks}
                totalPlaylists={totalPlaylists}
                limit={limit}
                offset={offset}
                loadMore={loadMore}
                loadPrevious={loadPrevious}
                changeLimit={changeLimit}
                deletePlaylist={deletePlaylist}
                isDeletingPlaylist={isDeletingPlaylist}
                isLoadingPlaylists={isLoadingPlaylists}
                currentPage={currentPage}
                error={playlistsError}
                savedQueries={savedQueries}
                queriesError={queriesError}
                saveNewQuery={saveNewQuery}
                loadPage={loadPage}
                updatePlaylistTracks={updatePlaylistTracks}
              />
            </div>
            <div className="mb-4 flex justify-center space-x-2">
              <button 
                onClick={() => setSelectedTab('recommendations')}
                className={`px-6 py-2 w-1/6 rounded-full font-semibold transition-all duration-300 ease-in-out ${
                  selectedTab === 'recommendations'
                    ? 'bg-button-primary text-white'
                    : 'border-2 border-button-primary text-button-primary hover:bg-button-primary hover:text-white'
                }`}
              >
                Recommendations
              </button>
              <div 
                ref={playlistButtonRef}
                onMouseEnter={() => !selectedPlaylist && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="relative w-1/6"
              >
                <select
                  value={gridSelectedPlaylist?.id || ''}
                  onChange={(e) => handleGridPlaylistSelect(e.target.value)}
                  className={`px-6 py-2 w-full rounded-full truncate font-semibold transition-all duration-300 ease-in-out ${
                    selectedTab === 'playlist'
                      ? 'bg-button-primary text-white'
                      : selectedPlaylist
                        ? 'border-2 border-button-primary text-button-primary hover:bg-button-primary hover:text-white'
                        : 'border-2 border-gray-400 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <option value="">Select Playlist</option>
                  {savedPlaylists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <MusicGrid 
              recommendations={memoizedRecommendations}
              playlistTracks={gridSelectedPlaylistTracks?.items.map(item => ({
                uri: item.track.uri,
                name: item.track.name,
                artists: item.track.artists.map((artist: { name: string }) => artist.name).join(', '),
                href: item.track.href,
              })) || []}
              onLoadMore={memoizedLoadMoreResults}
              isLoading={isLoadingMemoizedResults || isLoadingSelectedPlaylist} 
              selectedTab={selectedTab}
              isMobile={isMobile}
              selectedPlaylist={gridSelectedPlaylist}
              removeTrackFromPlaylist={removeTrackFromPlaylist}
            />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
