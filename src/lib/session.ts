import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { isRole, type Role } from "./auth/roles";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * Data Access Layer: the single place the session is read and checked.
 * Pages and Server Actions call these rather than reading cookies themselves.
 * Cached per request, so several components can call it cheaply.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Read the request headers before touching auth(): this is what tells Next.js
  // the rest is request-time work, so builds never need runtime secrets.
  const requestHeaders = await headers();
  const session = await auth().api.getSession({ headers: requestHeaders });
  if (!session || session.user.banned) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: isRole(role) ? role : "editor" };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
