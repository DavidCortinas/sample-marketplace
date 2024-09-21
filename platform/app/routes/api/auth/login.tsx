import { ActionFunction, json, redirect } from "@remix-run/node";
import { getUserDetails, serverLogin, setAccessToken, setRefreshToken } from "../../../utils/auth.server";
import { getSession, commitSession } from "../../../session";


export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  console.log('login api action called')

  try {
    const data = await serverLogin(email, password);
    
    if ('error' in data) {
      return json({ success: false, error: data.error }, { status: 400 });
    }
    
    const { access, refresh, onboarding_required } = data;

    // Set the tokens in cookies
    const accessTokenCookie = await setAccessToken(access);
    const refreshTokenCookie = await setRefreshToken(refresh);

    // Get user details
    const userDetailsResponse = await getUserDetails(access);
    console.log('user details response', userDetailsResponse)
    const userDetails = await userDetailsResponse.json();
    console.log('user details', userDetails)

    // Store user details in session
    const session = await getSession(request.headers.get("Cookie"));
    console.log('storing user details in session', userDetails)
    session.set("user", userDetails);
    console.log('session after storing user details', session.data)

    // Commit the session and set cookies
    const headers = new Headers();
    headers.append("Set-Cookie", await commitSession(session));
    headers.append("Set-Cookie", accessTokenCookie);
    headers.append("Set-Cookie", refreshTokenCookie);

    // Determine where to redirect
    const redirectTo = onboarding_required ? "/onboarding" : "/dashboard";

    console.log("Session at redirect:", session.data);

    return redirect(`${redirectTo}?success=true`, { headers });
  } catch (error) {
    console.error("Login error:", error);
    return json({ success: false, error: "Login failed" }, { status: 400 });
  }
};
