import { json } from "@remix-run/node";
import { serverRegister } from "../../../utils/auth.server";

export const action = async ({ request }: { request: Request }) => {
  // Check if the request is JSON
  const contentType = request.headers.get("Content-Type");
  let email, password;

  if (contentType && contentType.includes("application/json")) {
    const body = await request.json();
    email = body.email;
    password = body.password;
  } else {
    // Handle form data
    const formData = await request.formData();
    email = formData.get("email") as string;
    password = formData.get("password") as string;
  }

  if (!email || !password) {
    return json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    const data = await serverRegister(email, password);
    return json(data);
  } catch (error) {
    console.error("Registration error:", error);
    return json(
      { success: false, error: "Registration failed" },
      { status: 500 }
    );
  }
};
