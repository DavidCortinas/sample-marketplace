import { ActionFunction, json } from "@remix-run/node";
import { getSession, commitSession } from "../../session.server";

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request);
  const formData = await request.formData();

  const user = session.get("user");
  if (user && formData.get("onboarding_completed") === "true") {
    user.onboarding_completed = true;
    session.set("user", user);
  }

  return json(
    { success: true },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};
