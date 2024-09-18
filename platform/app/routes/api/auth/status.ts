import { json } from "@remix-run/node";
import { getAuthStatus } from "../../../utils/auth.server";

export async function loader({ request }: { request: Request }) {
  const isAuthenticated = await getAuthStatus(request);
  return json({ isAuthenticated });
}
