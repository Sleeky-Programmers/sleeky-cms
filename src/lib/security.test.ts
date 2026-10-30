import { describe, expect, it } from "vitest";
import { generateToken, hashToken, safeRedirectPath } from "./security";

describe("safeRedirectPath", () => {
  it.each(["/", "/users", "/users?tab=invites", "/content/insights/new"])("allows the in-app path %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    "https://evil.example.com",
    "//evil.example.com",
    "/\\evil.example.com",
    "javascript:alert(1)",
    "users",
    "/users\nSet-Cookie: x=1",
  ])("rejects %s", (path) => {
    expect(safeRedirectPath(path)).toBe("/");
  });

  it.each(["/sign-in", "/sign-in?next=/users", "/invite/abc", "/reset-password", "/forgot-password"])(
    "never sends the user back into the auth screen %s",
    (path) => {
      expect(safeRedirectPath(path)).toBe("/");
    },
  );

  it("uses the fallback for non-strings", () => {
    expect(safeRedirectPath(null, "/home")).toBe("/home");
    expect(safeRedirectPath(undefined)).toBe("/");
  });
});

describe("tokens", () => {
  it("generates long, unique, URL-safe tokens", () => {
    const tokens = new Set(Array.from({ length: 50 }, generateToken));
    expect(tokens.size).toBe(50);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("hashes deterministically without storing the token itself", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toContain(token);
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});
