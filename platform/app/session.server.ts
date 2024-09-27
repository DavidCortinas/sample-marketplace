import { createCookieSessionStorage, redirect } from "@remix-run/node";
import type { Session } from "@remix-run/node";
import { User } from "./types/user";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function commitSession(session: Session) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(session: Session) {
  return sessionStorage.destroySession(session);
}

export async function createUserSession(user: User, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("user", user);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserFromSession(
  request: Request
): Promise<User | null> {
  const session = await getSession(request);
  const user = session.get("user");
  if (!user) return null;
  return user as User;
}

export async function requireUser(request: Request) {
  const session = await getSession(request);
  const user = session.get("user");

  if (!user) {
    throw redirect(
      "/login?redirectTo=" + encodeURIComponent(new URL(request.url).pathname)
    );
  }

  return user;
}
