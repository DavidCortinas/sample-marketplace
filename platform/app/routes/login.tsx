import { useActionData, useSearchParams, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { ActionData, LoginForm } from "../components/LoginForm";
import { getSession, commitSession } from "../session.server";

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

  const url = new URL(request.url);
  const origin = url.origin;

  const response = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!data.success) {
    return json({ error: data.error }, { status: 400 });
  }

  // Get the session and set the user data
  const session = await getSession(request);
  session.set("user", data.user);
  session.set("accessToken", data.accessToken);
  session.set("refreshToken", data.refreshToken);

  // Redirect with the committed session
  return redirect(data.redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
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
