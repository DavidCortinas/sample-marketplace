import { json, LoaderFunction } from "@remix-run/node";
import { authenticatedFetch } from "../../utils/api.server";
import { getSession } from "../../session.server";

let cachedPlaylists: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60000; // 1 minute in milliseconds

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  const playlistId = url.searchParams.get("playlistId");

  // If fetching all playlists and cache is valid, return cached data
  if (!playlistId && cachedPlaylists && (Date.now() - lastFetchTime) < CACHE_DURATION) {
    return json(cachedPlaylists);
  }

  try {
    let response;
    if (playlistId) {
      // Get a single playlist
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
      response = await authenticatedFetch("/spotify/playlists/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        request,
      });
    }

    const data = await response.json();

    // Update cache if fetching all playlists
    if (!playlistId) {
      cachedPlaylists = data;
      lastFetchTime = Date.now();
    }

    return json(data);
  } catch (error) {
    console.error("Error fetching playlist(s):", error);
    if (error instanceof Error && error.message.includes("Please log in again")) {
      return json({ error: "Your session has expired. Please log in again." }, { status: 401 });
    }
    return json({ error: "Failed to fetch playlist(s)" }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request);

  try {
    const formData = await request.formData();
    const playlistDataString = formData.get("playlistData") as string;
    const action = formData.get("action") as string;

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
        response = await authenticatedFetch(`/spotify/playlists/${playlistId}/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(playlistData),
          request,
        });
        break;
      case "reorder_items":
        response = await authenticatedFetch(`/spotify/playlists/${playlistId}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(playlistData),
          request,
        });
        break;
      case "remove_items":
        response = await authenticatedFetch(`/spotify/playlists/${playlistId}/?action=remove_items`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(playlistData),
          request,
        });
        break;
      case "delete":
        response = await authenticatedFetch(`/spotify/playlists/${playlistId}/`, {
          method: "DELETE",
          request,
        });
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
