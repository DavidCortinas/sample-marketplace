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
  return await accessTokenCookie.serialize(token);
}

export async function setRefreshToken(token: string) {
  return await refreshTokenCookie.serialize(token);
}

export async function getAccessToken(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) return null;

  const token = await accessTokenCookie.parse(cookieHeader);

  if (!token) return null;

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
    }

    return response.json();
  } catch (error) {
    console.error("Registration error in serverRegister:", error);
    throw error;
  }
}

export async function serverLogin(email: string, password: string) {
  try {
    const response = await serverFetch(`${AUTH_BASE_URL}/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

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
  try {
    const data = await serverFetch(`${AUTH_BASE_URL}/user/details/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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

  try {
    await serverFetch(`${AUTH_BASE_URL}/logout/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    // Clear the cookies
    const {
      accessToken: clearedAccessToken,
      refreshToken: clearedRefreshToken,
    } = await clearTokens();

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

export async function serverRefreshToken(
  refreshToken: string
): Promise<AuthTokens | { error: string; status: number }> {
  try {
    const response = await serverFetch(`${AUTH_BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.error(
        "Token refresh failed:",
        response.status,
        response.statusText
      );
      return { error: "Token refresh failed", status: response.status };
    }

    const data = await response.json();

    if (!data.access) {
      console.error("Token refresh response missing access token:", data);
      return { error: "Invalid token refresh response", status: 500 };
    }

    return {
      access: data.access,
      refresh: data.refresh || refreshToken, // Use old refresh token if new one not provided
    };
  } catch (error) {
    console.error("Server token refresh error:", error);
    return { error: "Token refresh failed", status: 500 };
  }
}

export async function getAuthStatus(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return false;
  }
  try {
    const response = await serverFetch(`${AUTH_BASE_URL}/status/`, {
      headers: { Authorization: authHeader },
    });
    const data = await response.json();
    return data.is_authenticated;
  } catch (error) {
    console.error("Auth status check failed:", error);
    return false;
  }
}

export async function refreshTokenIfNeeded(request: Request): Promise<AuthTokens | null> {
  const refreshToken = await getRefreshToken(request);
  
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await serverRefreshToken(refreshToken);
    const data = await response.json();
    
    if ('error' in data) {
      throw new Error(data.error);
    }

    const { access, refresh } = data;

    // Set new cookies
    const headers = new Headers();
    headers.append("Set-Cookie", await setAccessToken(access));
    headers.append("Set-Cookie", await setRefreshToken(refresh));

    return { access, refresh };
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}
