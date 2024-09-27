import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getAccessToken } from "../../utils/auth.server";

export const action: ActionFunction = async ({ request }) => {
  const token = await getAccessToken(request);

  if (!token) {
    return json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();

  try {
    // Replace with your actual Django API URL
    const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${DJANGO_API_URL}/api/complete-onboarding/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        // If the error response is JSON, parse it
        const errorData = await response.json();
        return json({ error: errorData.message || 'Failed to complete onboarding' }, { status: response.status });
      } else {
        // If it's not JSON, return the status text
        const errorText = await response.text();
        console.error('Non-JSON error response:', errorText);
        return json({ error: `Failed to complete onboarding: ${response.statusText}` }, { status: response.status });
      }
    }

    const responseData = await response.json();
    return json(responseData);

  } catch (error) {
    console.error('Error submitting onboarding data:', error);
    return json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
};
