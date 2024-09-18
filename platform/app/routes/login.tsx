import { useActionData, Form, useNavigate, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { serverLogin, getUserDetails } from "../utils/auth.server";
import { ActionData, LoginForm } from "../components/LoginForm";

export const loader: LoaderFunction = async () => {
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const result = await serverLogin(email, password);
    const data = await result.json();
    console.log("Data:", data);

    if (data.access && data.refresh) {
      const userDetailsResponse = await getUserDetails(data.access);
      const userDetails = await userDetailsResponse.json();
      return json({ 
        success: true, 
        access: data.access, 
        refresh: data.refresh,
        onboarding_required: data.onboarding_required,
        user: userDetails,
      });
    } else {
      return json({ success: false, error: data.error || "Login failed" });
    }
  } catch (error) {
    return json({ success: false, error: "An unexpected error occurred" });
  }
};

export default function Login() {
  const actionData = useActionData<ActionData>();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);

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
          isLoading={false}
          errorMessage=""
          isLogin={isLogin}
          setIsLogin={setIsLogin}
        />
      </div>
    </div>
  );
}
