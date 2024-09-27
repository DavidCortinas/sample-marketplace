import { json, LoaderFunction, ActionFunction } from "@remix-run/node";
import { authenticatedFetch } from "../../utils/api.server";
import { getSession, commitSession } from "../../session.server";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const response = await authenticatedFetch("/spotify/playlists/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      request,
    });

    const playlists = await response.json();
    return json(playlists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    if (
      error instanceof Error &&
      error.message.includes("Please log in again")
    ) {
      return json(
        { error: "Your session has expired. Please log in again." },
        { status: 401 }
      );
    }
    return json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request);

  try {
    const formData = await request.formData();
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

    if (request.method === "POST") {
      response = await authenticatedFetch("/spotify/playlists/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playlistData),
        request,
      });
    } else if (request.method === "PUT") {
      const playlistId = playlistData.id;
      response = await authenticatedFetch(`/spotify/playlists/${playlistId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playlistData),
        request,
      });
    } else if (request.method === "DELETE") {
      const playlistId = playlistData.id;
      response = await authenticatedFetch(`/spotify/playlists/${playlistId}/`, {
        method: "DELETE",
        request,
      });
    } else {
      return json({ error: "Method not allowed" }, { status: 405 });
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
