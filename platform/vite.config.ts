import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    remix({
      routes(defineRoutes) {
        return defineRoutes((route) => {
          route("api/auth/status", "routes/api/auth/status.ts");
          route("api/auth/register", "routes/api/auth/register.ts");
          route(
            "api/resend-verification-email",
            "routes/api/resend-verification-emails.ts"
          );
          route("api/auth/login", "routes/api/auth/login.tsx");
          route("api/auth/logout", "routes/api/auth/logout.ts");
          route("api/user/details", "routes/api/user/details.ts");
          route("api/complete-onboarding", "routes/api/complete-onboarding.ts");
          route("api/update-session", "routes/api/update-session.ts");
          route("api/spotify-auth", "routes/api/spotify-auth.ts");
          route("api/spotify-callback", "routes/api/spotify-callback.ts");
          route(
            "api/auth/google/callback",
            "routes/api/auth/google.callback.tsx"
          );
        });
      },
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "~": "/app",
    },
  },
  server: {
    port: 5173,
    hmr: {
      port: 8002,
    },
  },
});
