import { useActionData, useSearchParams, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { ActionData, LoginForm } from "../components/LoginForm";
import { getSession, commitSession } from "../session.server";
import { serverLogin, getUserDetails, setAccessToken, setRefreshToken } from "../utils/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  const user = session.get("user");

  if (user) {
    return redirect("/discover");
  }

  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const loginData = await serverLogin(email, password);
    
    if ('error' in loginData) {
      return json({ success: false, error: loginData.error }, { status: 400 });
    }

    const { access, refresh, onboarding_required } = loginData;

    // Set tokens in cookies
    const accessTokenCookie = await setAccessToken(access);
    const refreshTokenCookie = await setRefreshToken(refresh);

    // Get user details
    const userDetails = await getUserDetails(access);

    // Store user details in session
    const session = await getSession(request);
    session.set("user", userDetails.data);

    // Determine where to redirect
    const redirectTo = onboarding_required ? "/onboarding" : "/dashboard";

    // Commit the session and set cookies
    const headers = new Headers();
    headers.append("Set-Cookie", await commitSession(session));
    headers.append("Set-Cookie", accessTokenCookie);
    headers.append("Set-Cookie", refreshTokenCookie);

    return redirect(redirectTo, { headers });
  } catch (error) {
    console.error("Login error:", error);
    return json({ success: false, error: "Login failed" }, { status: 500 });
  }
};

export default function Login() {
  const actionData = useActionData<ActionData>();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen map-overlay map-background">
      <div className="w-full max-w-md">
        <LoginForm
          actionData={actionData}
          isLoading={navigation.state === "submitting"}
          errorMessage=""
          isLogin={isLogin}
          setIsLogin={setIsLogin}
        />
      </div>
    </div>
  );
}
