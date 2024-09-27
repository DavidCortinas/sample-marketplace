import { LoaderFunction, redirect } from "@remix-run/node";
import { getSession, commitSession } from "../../session.server";
import { API_BASE_URL } from "../../config";


export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return redirect("/onboarding?error=spotify_auth_failed");
  }

  if (!code) {
    return redirect("/onboarding?error=no_spotify_code");
  }

  const session = await getSession(request);
  const userId = session.get("user").id;

  if (!userId) {
    return redirect("/login");
  }

  const response = await fetch(`${API_BASE_URL}/api/spotify/callback/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, user_id: userId }),
  });

  if (!response.ok) {
    return redirect("/onboarding?error=spotify_token_exchange_failed");
  }

  session.set("spotifyConnected", true);
  return redirect("/discover", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};
