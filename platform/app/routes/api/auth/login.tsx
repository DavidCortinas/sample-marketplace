import { json } from "@remix-run/node";
import { getUserDetails, serverLogin } from "../../../utils/auth.server";

export const action = async ({ request }: { request: Request }) => {
  const { email, password } = await request.json();

  try {
    const data = await serverLogin(email, password);
    
    if ('error' in data) {
      return json({ success: false, error: data.error }, { status: 400 });
    }
    
    const { access, refresh, onboarding_required } = data;

    // Get user details
    const userDetailsResponse = await getUserDetails(access);
    const userDetails = await userDetailsResponse.json();

    // Determine where to redirect
    const redirectTo = onboarding_required ? "/onboarding" : "/discover";

    return json({
      success: true,
      redirectTo,
      user: userDetails.data,
      accessToken: access,
      refreshToken: refresh
    });
  } catch (error) {
    console.error("Login error:", error);
    return json({ success: false, error: "Login failed" }, { status: 500 });
  }
};
