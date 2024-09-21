import { Outlet, useLocation, useOutletContext, useNavigate } from "@remix-run/react";
import { useState, useEffect, useCallback } from "react";
import DiscoverHeader from "../components/DiscoverHeader";
import DiscoverSidebar from "../components/DiscoverSearchForm/DiscoverSidebar";
import { DiscoverResults } from "../components/DiscoverResults";
import type { OutletContext } from "../types/outlet";
import { LoaderFunction, json } from "@remix-run/node";
import { getAccessToken, getRefreshToken } from "../utils/auth.server";
import { MobileSearchForm } from "../components/DiscoverSearchForm/MobileSearchForm";
import { useSpotify } from "../hooks/useSpotify";
import { FormattedResult, CategoryLabel, AdvancedParams, Query } from "../types/recommendations/types";
import { handleCategoryChange, handleInputChange, handleSelection, handleSubmit, handleParamToggle, handleParamChange, getSliderValue, formatParamValue, handleRemoveSelection, handleSaveQuery, handleSelectQuery, handleSwitchToSearch } from "../utils/discoverSearchForm";



export const loader: LoaderFunction = async ({ request }) => {
  const accessToken = await getAccessToken(request);
  const refreshToken = await getRefreshToken(request);
  console.log('discover route loader access', accessToken)
  console.log('discover route loader refresh', refreshToken)
  return json({ accessToken, refreshToken });
};

export default function Discover() {
  const location = useLocation();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user } = useOutletContext<OutletContext>();
  const [isMobile, setIsMobile] = useState(false);

  // SEARCH FORM STATE
    const { getAccessToken } = useSpotify();
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
  const [savedQueries, setSavedQueries] = useState<Query[]>([]);

  const navigate = useNavigate();

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

  return (
    <div className="flex flex-col h-screen bg-gray-100 md:flex-row">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0">
        <DiscoverSidebar 
          user={user}
          getAccessToken={getAccessToken}
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
          handleSaveQuery={() => handleSaveQuery(selections, category, advancedParams, setSavedQueries)}
          handleSelectQuery={(query) => handleSelectQuery(query, setSelections, setCategory, setAdvancedParams, setSidebarMode)}
          handleSwitchToSearch={() => handleSwitchToSearch(setSidebarMode)}
          selections={selections}
          advancedParams={advancedParams}
          savedQueries={savedQueries}
          hoveredParam={hoveredParam}
          setHoveredParam={setHoveredParam} 
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
                getAccessToken={getAccessToken}
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
                handleSaveQuery={() => handleSaveQuery(selections, category, advancedParams, setSavedQueries)}
                handleSelectQuery={(query) => handleSelectQuery(query, setSelections, setCategory, setAdvancedParams, setSidebarMode)}
                handleSwitchToSearch={() => handleSwitchToSearch(setSidebarMode)}
                selections={selections}
                advancedParams={advancedParams}
                savedQueries={savedQueries}
                hoveredParam={hoveredParam}
                setHoveredParam={setHoveredParam} 
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
              <>
                <DiscoverResults isLoading={isLoading} results={recommendations} onLoadMore={loadMoreResults} />
                {/* {isLoading && (
                  <div className="text-center py-4 text-gray-600 font-semibold">
                    Digging up more gems...
                  </div>
                )}
                {!isLoading && !hasMore && recommendations.length > 0 && (
                  <div className="text-center py-4 text-gray-600 font-semibold">
                    {"That's all the gems we could find!"}
                  </div>
                )} */}
              </>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
