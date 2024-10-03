import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { authenticatedFetch } from "../../utils/api.server";
import { getSession, commitSession } from "../../session.server";

interface CachedData {
  data: any;
  timestamp: number;
}

const playlistCache: { [key: string]: CachedData } = {};
const CACHE_DURATION = 60000; // 1 minute in milliseconds

export const loader: LoaderFunction = async ({ request, params }) => {
  console.log("API/PLAYLISTS LOADER CALLED", {
    url: request.url,
    method: request.method,
  });
  const url = new URL(request.url);
  const playlistId = url.searchParams.get("playlistId");
  const limit = url.searchParams.get("limit") || "20";
  const offset = url.searchParams.get("offset") || "0";

  console.log("Incoming request for playlists:", { playlistId, limit, offset });

  // Create a cache key that includes limit and offset
  const cacheKey = playlistId ? playlistId : `all_${limit}_${offset}`;

  // Check if we have a valid cached response for this specific request
  if (
    playlistCache[cacheKey] &&
    Date.now() - playlistCache[cacheKey].timestamp < CACHE_DURATION
  ) {
    console.log("Returning cached playlists for", cacheKey);
    return json(playlistCache[cacheKey].data);
  }

  try {
    let response;
    if (playlistId) {
      // Get a single playlist
      console.log("Fetching single playlist:", playlistId);
      response = await authenticatedFetch(`/spotify/playlists/${playlistId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        request,
      });
    } else {
      // Get all playlists
      console.log("Fetching all playlists");
      let url = `/spotify/playlists/?limit=${limit}&offset=${offset}`;
      response = await authenticatedFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        request,
      });
    }

    const data = await response.json();

    // Cache the new data
    playlistCache[cacheKey] = {
      data: data,
      timestamp: Date.now(),
    };

    return json(data);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request);

  try {
    const formData = await request.formData();
    const action = formData.get("action") as string;
    const playlistDataString = formData.get("playlistData") as string;

    let playlistData;
    try {
      playlistData = JSON.parse(playlistDataString);
      console.log("Received playlist data:", playlistData);
    } catch (error) {
      console.error("Error parsing playlistData:", error);
      return json({ error: "Invalid playlist data format" }, { status: 400 });
    }

    let response;
    const playlistId = playlistData.id;

    switch (action) {
      case "create":
        response = await authenticatedFetch("/spotify/playlists/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(playlistData),
          request,
        });
        break;
      case "add_items":
        response = await authenticatedFetch(
          `/spotify/playlists/${playlistId}/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(playlistData),
            request,
          }
        );
        break;
      case "reorder_items":
        response = await authenticatedFetch(
          `/spotify/playlists/${playlistId}/`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(playlistData),
            request,
          }
        );
        break;
      case "remove_items":
        response = await authenticatedFetch(
          `/spotify/playlists/${playlistId}/?action=remove_items`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(playlistData),
            request,
          }
        );
        break;
      case "delete":
        response = await authenticatedFetch(
          `/spotify/playlists/${playlistId}/`,
          {
            method: "DELETE",
            request,
          }
        );
        break;
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await response.json();
    return json(result);
  } catch (error) {
    console.error("Error handling playlist action:", error);
    return json(
      { error: "Failed to process playlist action" },
      {
        status: 500,
        headers: { "Set-Cookie": await commitSession(session) },
      }
    );
  }
};
