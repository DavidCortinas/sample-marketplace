import { Outlet, useLocation, useOutletContext } from "@remix-run/react";
import { useState, useEffect, useCallback } from "react";
import DiscoverHeader from "../components/DiscoverHeader";
import DiscoverSidebar from "../components/DiscoverSidebar";
import { DiscoverResults } from "../components/DiscoverResults";
import type { OutletContext } from "../types/outlet";
import { LoaderFunction, json } from "@remix-run/node";
import { getAccessToken } from "../utils/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const accessToken = await getAccessToken(request);
  return json({ accessToken });
};

export default function Discover() {
  const location = useLocation();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user } = useOutletContext<OutletContext>();

  useEffect(() => {
    if (location.state?.recommendations) {
      setRecommendations(location.state.recommendations);
      setIsInitialLoad(false);
    }
  }, [location.state?.recommendations]);

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
    <div className="flex h-screen bg-gray-100">
      <DiscoverSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DiscoverHeader user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto map-background map-overlay">
          <div className="container mx-auto px-6 py-8 h-3/4">
            {isInitialLoad ? (
              <div className="flex justify-center items-center h-full">
                <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-8 rounded-lg shadow-md max-w-md w-full text-white">
                  <h2 className="text-2xl font-bold mb-4">Ready to Discover?</h2>
                  <p className="mb-6 text-orange-100">
                    Use the control panel in the sidebar to start digging up musical gems! Adjust your preferences and watch as we unearth tracks tailored just for you.
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
