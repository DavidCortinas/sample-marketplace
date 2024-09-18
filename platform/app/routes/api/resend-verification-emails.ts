import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const email = formData.get('email');

  if (!email) {
    return json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${DJANGO_API_URL}/api/resend-verification-email/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ email: email.toString() }),
    });

    if (response.ok) {
      return json({ message: "Verification email resent successfully" });
    } else {
      const errorData = await response.json();
      return json({ error: errorData.error || "Failed to resend verification email" }, { status: response.status });
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
};
