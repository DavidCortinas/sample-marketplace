import { ActionFunction, json } from "@remix-run/node";
import { getUserDetails, serverLogin, setAccessToken, setRefreshToken } from "../../../utils/auth.server";
import { getSession, commitSession } from "../../../session.server";


export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const response = await serverLogin(email, password);
    const data = await response.json();
    
    if ('error' in data) {
      return json({ success: false, error: data.error }, { status: 400 });
    }
    
    const { access, refresh, onboarding_required } = data;

    // Set the tokens in cookies
    const accessTokenCookie = await setAccessToken(access);
    const refreshTokenCookie = await setRefreshToken(refresh);

    // Get user details
    const userDetailsResponse = await getUserDetails(access);
    const userDetails = await userDetailsResponse.json();

    // Store user details in session
    const session = await getSession(request);
    session.set("user", userDetails);

    // Determine where to redirect
    const redirectTo = onboarding_required ? "/onboarding" : "/discover";

    return json(
      { success: true, redirectTo },
      {
        headers: {
          "Set-Cookie": [
            accessTokenCookie,
            refreshTokenCookie,
            await commitSession(session)
          ].join(", ")
        }
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return json({ success: false, error: "Login failed" }, { status: 400 });
  }
};
