import { ActionFunction, json } from "@remix-run/node";
import { serverLogout } from "../../../utils/auth.server";

export const action: ActionFunction = async ({ request }) => {
  console.log("API logout action triggered");
  
  if (request.method !== "POST") {
    console.log("Method not allowed");
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const result = await serverLogout(request);
    console.log("API serverLogout completed successfully");
    return result;
  } catch (error) {
    console.error("API Logout failed:", error);
    return json({ error: "Logout failed" }, { status: 500 });
  }
};
