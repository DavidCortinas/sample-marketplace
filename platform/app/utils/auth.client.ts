import { useAuthStore } from "../stores/authStore";
import { AxiosError } from "axios";
import api from "./api.client";

export async function logout(): Promise<void> {
  const { accessToken, clearTokens } = useAuthStore.getState();
  try {
    // Call the server-side logout endpoint
    await api.post(
      "/auth/logout",
      {},
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      }
    );

    // Clear client-side tokens
    clearTokens();
  } catch (error) {
    console.error("Logout failed:", error);
    // Even if the server-side logout fails, clear the client-side tokens
    clearTokens();
    throw error;
  }
}

export async function refreshToken(): Promise<string | null> {
  const { refreshToken, setTokens } = useAuthStore.getState();

  if (!refreshToken) return null;

  try {
    // Call the Remix route instead of directly calling the Django backend
    const response = await api.post("/api/auth/refresh-token", {
      refresh: refreshToken,
    });
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      response.data;
    setTokens(newAccessToken, newRefreshToken);
    return newAccessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

// export function handleAxiosError(error: unknown): never {
//   if (error instanceof AxiosError) {
//     throw new Error(error.response?.data.detail || "An error occurred");
//   }
//   throw error;
// }

// export function getAccessToken(): string | null {
//   return useAuthStore.getState().accessToken;
// }

// export function getRefreshToken(): string | null {
//   return useAuthStore.getState().refreshToken;
// }

// export function setAccessToken(token: string): void {
//   useAuthStore.getState().setTokens(token, useAuthStore.getState().refreshToken || '');
// }

// export function setRefreshToken(token: string): void {
//   useAuthStore.getState().setTokens(useAuthStore.getState().accessToken || '', token);
// }

// export function clearTokens(): void {
//   useAuthStore.getState().clearTokens();
// }