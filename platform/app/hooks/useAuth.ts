import { useCallback } from "react";
import { useNavigate } from "@remix-run/react";
import { useAuthStore } from "../stores/authStore";

export function useAuth() {
  const navigate = useNavigate();
  const { accessToken, refreshToken, setTokens, clearTokens } = useAuthStore();

  const login = useCallback((accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    navigate("/discover");
  }, [setTokens, navigate]);

  const logout = useCallback(() => {
    clearTokens();
    navigate("/login");
  }, [clearTokens, navigate]);

  const isAuthenticated = !!accessToken;

  return {
    isAuthenticated,
    login,
    logout,
    accessToken,
    refreshToken,
  };
}
