import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const contentType = request.headers.get("Content-Type");

    let email, password;

    if (contentType?.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } else {
      const formData = await request.formData();
      email = formData.get('email');
      password = formData.get('password');
    }

    if (!email || !password) {
      return json({ error: "Email and password are required" }, { status: 400 });
    }

    // Here, you would typically call your Django backend
    // For now, let's simulate a successful registration
    return json({ success: true, message: "Debug response from API route" }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("API route: Error processing request", error);
    return json({ error: "Invalid request", details: error.message }, { status: 400 });
  }
};
