import create from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api.client'

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string , refreshToken: string) => void;
  clearTokens: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AUTH_BASE_URL = "http://localhost:8000/api/auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;

        try {
          const response = await api.post(`${AUTH_BASE_URL}/token/refresh/`, { refresh: refreshToken });
          const { access: newAccessToken, refresh: newRefreshToken } = response.data;
          set({ accessToken: newAccessToken, refreshToken: newRefreshToken });
          return newAccessToken;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          set({ accessToken: null, refreshToken: null });
          return null;
        }
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
)
