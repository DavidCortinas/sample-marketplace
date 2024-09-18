import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getUserDetails } from "../../../utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const token = request.headers.get("Authorization")?.split(" ")[1];
  if (!token) return json({ error: "No token provided" }, { status: 401 });
  
  const userDetails = await getUserDetails(token);
  return json(userDetails);
};
