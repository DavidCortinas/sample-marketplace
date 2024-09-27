import { useActionData, Form, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";

type ActionData = {
  success?: boolean;
  error?: string;
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const url = new URL(request.url);
  const origin = url.origin;

  try {
    const response = await fetch(`${origin}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to login page or onboarding page after successful registration
      return redirect("/check-email?registered=true");
    } else {
      return json({ success: false, error: data.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return json({ success: false, error: "Registration failed" }, { status: 500 });
  }
};

export default function Register() {
  const actionData = useActionData<ActionData>();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.success) {
      navigate('/check-email?registered=true');
    }
  }, [actionData, navigate]);

  return (
    <div>
      <h1>Register</h1>
      <Form method="post">
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
        </div>
        <button type="submit">Register</button>
      </Form>
      {actionData?.error && <p>{actionData.error}</p>}
    </div>
  );
}
