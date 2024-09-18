import { useActionData, Form, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json} from "@remix-run/node";
import { serverRegister } from "../utils/auth.server";

export const loader: LoaderFunction = async () => {
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;


  try {
    const result = await serverRegister(email, password);
    const data = await result.json();


    if (data.success && data.access && data.refresh) {
      return json({ success: true, access: data.access, refresh: data.refresh });
    } else {
      return json({ success: false, error: data.error || data.message || "Registration failed" });
    }
  } catch (error) {
    console.error("REGISTER ROUTE: Error in register action:", error);
    return json({ success: false, error: "An unexpected error occurred" });
  }
};

export default function Register() {
  const actionData = useActionData();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.success && actionData?.access && actionData?.refresh) {
      // Store tokens in local storage or state management
      localStorage.setItem('accessToken', actionData.access);
      localStorage.setItem('refreshToken', actionData.refresh);
      navigate('/check-email');
    }
  }, [actionData, navigate]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.currentTarget.submit();
  };

  return (
    <Form method="post" onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit">Register</button>
      {actionData?.error && <p>{actionData.error}</p>}
    </Form>
  );
}
