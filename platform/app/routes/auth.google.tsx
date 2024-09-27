import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import { API_BASE_URL } from "../config";

export const loader: LoaderFunction = async () => {
  return redirect("/login");
};

export const action: ActionFunction = async ({ request }) => {
  if (!API_BASE_URL) {
    console.error("API_BASE_URL is not defined");
    return redirect("/login?error=server_configuration");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/google/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error === 'account_exists') {
        return redirect("/login?error=account_exists");
      } else if (errorData.error === 'account_not_verified') {
        return redirect("/login?error=account_not_verified");
      }
      throw new Error(`Failed to initiate Google authentication: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.auth_url) {
      return redirect(data.auth_url);
    }

    throw new Error('No auth_url provided in response');

  } catch (error) {
    console.error('Error initiating Google auth:', error);
    return redirect("/login?error=google_auth_failed");
  }
};

export default function GoogleAuth() {
  return <div>Initiating Google authentication...</div>;
}
