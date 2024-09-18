import { LoaderFunction, redirect } from "@remix-run/node";
import { getSession } from "../../session.server";

export const loader: LoaderFunction = async ({ request }) => {
  console.log("spotify-auth");
  const session = await getSession(request);
  const userId = session.get("user")?.data.id;

  if (!userId) {
    return redirect("/login");
  }

  const response = await fetch(`${process.env.API_BASE_URL}/api/spotify/authorize/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error("Failed to initiate Spotify authorization");
  }

  const { authorization_url } = await response.json();
  return redirect(authorization_url);
};
