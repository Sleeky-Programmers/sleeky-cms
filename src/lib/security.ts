import { createHash, randomBytes } from "node:crypto";

/** A URL-safe random token with 256 bits of entropy. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Tokens are stored hashed, so a database leak doesn't expose usable invite links. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Returns a same-site path to send the user to after signing in, or the
 * fallback. Rejects absolute and protocol-relative URLs to prevent open redirects.
 */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  // Never bounce back into the auth screens themselves.
  if (/^\/(sign-in|invite|forgot-password|reset-password)(\/|\?|$)/.test(value)) return fallback;
  return value;
}
