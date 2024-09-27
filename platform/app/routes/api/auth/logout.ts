import { ActionFunction, json, redirect } from "@remix-run/node";
import { serverLogout } from "../../../utils/auth.server";
import { getSession, destroySession } from "../../../session.server";

export const action: ActionFunction = async ({ request }) => {

  if (request.method !== "POST") {
    console.log("Method not allowed");
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const session = await getSession(request);
    await serverLogout(request);

    // Clear the session
    const headers = new Headers({
      "Set-Cookie": await destroySession(session),
    });

    // Redirect to the discover page
    return redirect("/discover", { headers });
  } catch (error) {
    console.error("API Logout failed:", error);
    return json({ error: "Logout failed" }, { status: 500 });
  }
};
