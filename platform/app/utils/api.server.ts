import { serverRefreshToken } from "./auth.server";
import { getSession, commitSession } from "../session.server";

const BASE_URL = "http://localhost:8000/api";

export async function serverFetch(url: string, options: RequestInit = {}) {
  console.log("Server fetch URL:", url);
  console.log("Server fetch options:", options);
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  const response = await fetch(fullUrl, options);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Server fetch error body:", errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit & { request: Request },
  retryCount = 0
): Promise<Response> {
  const session = await getSession(options.request);
  const accessToken = session.get("accessToken");
  const refreshToken = session.get("refreshToken");

  if (!accessToken || !refreshToken) {
    throw new Error("No access token or refresh token available");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await serverFetch(url, fetchOptions);
    return response;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("status: 401") &&
      retryCount === 0
    ) {
      try {
        const newTokens = await serverRefreshToken(refreshToken);

        if ("error" in newTokens) {
          console.error("Token refresh failed:", newTokens.error);
          throw new Error("Authentication failed: Please log in again");
        }

        session.set("accessToken", newTokens.access);
        session.set("refreshToken", newTokens.refresh);
        await commitSession(session);

        // Retry the request with the new token
        const retryOptions = {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newTokens.access}`,
            "Content-Type": "application/json",
          },
        };
        return serverFetch(url, retryOptions);
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        throw new Error("Authentication failed: Please log in again");
      }
    } else {
      throw error;
    }
  }
}
