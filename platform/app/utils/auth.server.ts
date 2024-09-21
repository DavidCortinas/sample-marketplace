import { createCookie, json } from "@remix-run/node";
import { serverFetch } from "./api.server";
import { AuthTokens } from "../types/auth";

const AUTH_BASE_URL = "/auth";

const accessTokenCookie = createCookie("access_token", {
  maxAge: 3600, // 1 hour
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

const refreshTokenCookie = createCookie("refresh_token", {
  maxAge: 7 * 24 * 3600, // 7 days
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

export async function setAccessToken(token: string) {
  console.log("setAccessToken token", token);
  return await accessTokenCookie.serialize(token);
}

export async function setRefreshToken(token: string) {
  return await refreshTokenCookie.serialize(token);
}

export async function getAccessToken(request: Request): Promise<string | null> {
  console.log("getAccessToken request", request);
  const cookieHeader = request.headers.get("Cookie");
  console.log("getAccessToken cookieHeader", cookieHeader);
  if (!cookieHeader) return null;

  const token = await accessTokenCookie.parse(cookieHeader);
  console.log("getAccessToken token", token);
  if (!token) return null;

  // The token is no longer base64 encoded, so we can return it directly
  return token;
}

export async function getRefreshToken(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  return await refreshTokenCookie.parse(cookieHeader);
}

export async function clearTokens() {
  return {
    accessToken: await accessTokenCookie.serialize("", { maxAge: 0 }),
    refreshToken: await refreshTokenCookie.serialize("", { maxAge: 0 }),
  };
}

export async function serverRegister(email: string, password: string) {
  try {
    const response = await serverFetch(`${AUTH_BASE_URL}/register/`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return json(response);
  } catch (error) {
    console.error("Registration error in serverRegister:", error);
    return json(
      { success: false, error: "Registration failed" },
      { status: 400 }
    );
  }
}

export async function serverLogin(email: string, password: string) {
  console.log("Attempting login with email:", email);
  try {
    const response = await serverFetch(`${AUTH_BASE_URL}/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("Login response status:", response.status);
    console.log("Login response headers:", response.headers);

    const data = await response.json();
    console.log("Login response data:", data);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Server login error:", error);
    throw error;
  }
}

export async function getUserDetails(token: string) {
  console.log("Getting user details with token:", token);
  try {
    const data = await serverFetch(`${AUTH_BASE_URL}/user/details/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("User details response:", data);
    return data;
  } catch (error) {
    console.error("Get user details error:", error);
    return json({ error: "Failed to fetch user details" }, { status: 401 });
  }
}

export async function serverLogout(request: Request) {
  const formData = await request.formData();
  const accessToken = formData.get("accessToken");
  const refreshToken = formData.get("refreshToken");

  if (!accessToken) {
    console.error("No access token provided for logout");
    return json({ error: "No access token provided" }, { status: 400 });
  }
  
  if (!refreshToken) {
    console.error("No refresh token provided for logout");
    return json({ error: "No refresh token provided" }, { status: 400 });
  }

  console.log("Attempting logout with access token:", accessToken);
  console.log("Attempting logout with refresh token:", refreshToken);
  try {
    const response = await serverFetch(`${AUTH_BASE_URL}/logout/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    console.log("Python API response status:", response.status);
    console.log("Python API response body:", await response.text());

    // Clear the cookies
    const {
      accessToken: clearedAccessToken,
      refreshToken: clearedRefreshToken,
    } = await clearTokens();

    console.log("Cleared tokens:", { clearedAccessToken, clearedRefreshToken });

    return json(
      { success: true },
      {
        headers: {
          "Set-Cookie": [clearedAccessToken, clearedRefreshToken].join(", "),
        },
      }
    );
  } catch (error) {
    console.error("Server logout error:", error);
    return json({ error: "Logout failed" }, { status: 500 });
  }
}

export async function serverRefreshToken(refreshToken: string) {
  try {
    const data = await serverFetch(`${AUTH_BASE_URL}/token/refresh/`, {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });
    return json<AuthTokens>({
      access: data.access,
      refresh: data.refresh,
    });
  } catch (error) {
    console.error("Server token refresh error:", error);
    return json({ error: "Token refresh failed" }, { status: 400 });
  }
}

export async function getAuthStatus(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return false;
  }
  try {
    const data = await serverFetch(`${AUTH_BASE_URL}/status/`, {
      headers: { Authorization: authHeader },
    });
    return data.is_authenticated;
  } catch (error) {
    console.error("Auth status check failed:", error);
    return false;
  }
}
