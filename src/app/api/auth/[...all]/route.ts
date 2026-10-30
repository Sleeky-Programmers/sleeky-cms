import { auth } from "@/lib/auth";

// Better Auth's HTTP endpoints (session, sign-out, password reset links, admin API).
// Sign-up is disabled in the auth config; accounts come only from invitations.
export async function GET(request: Request) {
  return auth().handler(request);
}

export async function POST(request: Request) {
  return auth().handler(request);
}
