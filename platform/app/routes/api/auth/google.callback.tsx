import { LoaderFunction, redirect } from "@remix-run/node";
import { API_BASE_URL } from "../../../config"; // Adjust this import as needed
import { getUserDetails, setAccessToken, setRefreshToken } from "../../../utils/auth.server";
import { getSession, commitSession } from "../../../session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (code) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google/callback/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.access && data.refresh) {
        // Fetch user details
        const userDetailsResponse = await getUserDetails(data.access);
        const userDetails = await userDetailsResponse.json();

        // Store tokens in cookies
        const accessTokenCookie = await setAccessToken(data.access);
        const refreshTokenCookie = await setRefreshToken(data.refresh);

        // Store user details in session
        session.set("user", userDetails.data);
        session.set("accessToken", data.access);
        session.set("refreshToken", data.refresh);

        // Commit the session and set cookies
        const headers = new Headers();
        headers.append("Set-Cookie", await commitSession(session));
        headers.append("Set-Cookie", accessTokenCookie);
        headers.append("Set-Cookie", refreshTokenCookie);

        // Determine redirect based on onboarding status
        const redirectTo = data.onboarding_required ? "/onboarding" : "/discover";

        console.log("Session before commit:", session.data);

        return redirect(redirectTo, { headers });
      } else {
        // Handle specific errors
        const errorMessage = encodeURIComponent(data.message || 'An error occurred');
        return redirect(`/login?error=${data.error || 'backend_error'}&message=${errorMessage}`);
      }
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      return redirect("/login?error=token_exchange_failed&message=Failed to exchange token. Please try again.");
    }
  }

  if (error) {
    console.error("Google authentication error:", error);
    return redirect(`/login?error=${error}`);
  }

  console.error("Unexpected state in Google callback");
  return redirect("/login?error=unknown_error");
};
