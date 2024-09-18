import { useCallback } from 'react';
import type { ActionFunction, LinksFunction, LoaderFunction } from "@remix-run/node";
import { 
  json,
  Outlet, 
  useLoaderData,
  useFetcher,
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration
} from "@remix-run/react";
import { Layout } from './components/Layout';
import { SpotifyCredentials } from './hooks/useSpotify';
import { getSession, commitSession } from './session.server';
import { SpotifyScript } from './components/SpotifyScript';
import { User } from './types/user';
import styles from "./tailwind.css?url";
import customStyles from "./custom-style.css?url";


export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "stylesheet", href: customStyles },
  // Keep the existing preload link
  { rel: "preload", href: "https://open.spotify.com/embed/iframe-api/v1", as: "script" },
];

export const loader: LoaderFunction = async ({ request }) => {
  console.log("Root loader - Request cookies:", request.headers.get("Cookie"));
  const session = await getSession(request);
  console.log("Root loader - Full session data:", JSON.stringify(session.data, null, 2));
  const user = session.get("user");
  console.log("Root loader - User data:", user);

  return json({ user, spotifyCredentials: session.get("spotifyCredentials") });
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request);
  
  const response = await fetch('http://localhost:8000/api/spotify/auth/client-credentials/');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const credentials = await response.json();
  const updatedCredentials = { ...credentials, timestamp: Date.now() };
  
  session.set("spotifyCredentials", updatedCredentials);
  
  return json(
    { spotifyCredentials: updatedCredentials },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

export default function App() {
  const data = useLoaderData<{ user: User | undefined, spotifyCredentials: SpotifyCredentials }>();
  const fetcher = useFetcher();

  const refreshSpotifyToken = useCallback(() => {
    fetcher.submit(null, { method: "post" });
  }, [fetcher]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout>
          <Outlet context={{ 
            user: data.user,
            spotifyCredentials: fetcher.data?.spotifyCredentials || data.spotifyCredentials,
            refreshSpotifyToken 
          }}/>
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <SpotifyScript />
      </body>
    </html>
  );
}
