import { describe, expect, it } from "vitest";
import { acceptInvitationSchema, fieldErrors, inviteSchema, signInSchema } from "./validation";

describe("inviteSchema", () => {
  it("normalises the email and accepts known roles", () => {
    expect(inviteSchema.parse({ email: "  Ada@Sleeky.COM ", role: "editor" })).toEqual({ email: "ada@sleeky.com", role: "editor" });
  });

  it("rejects unknown roles and bad emails", () => {
    const result = inviteSchema.safeParse({ email: "not-an-email", role: "owner" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({ email: "Enter a valid email address.", role: "Choose a role." });
    }
  });
});

describe("acceptInvitationSchema", () => {
  const valid = { token: "t", name: "Ada Okafor", password: "correct horse battery", confirmPassword: "correct horse battery" };

  it("accepts a complete form", () => {
    expect(acceptInvitationSchema.safeParse(valid).success).toBe(true);
  });

  it("requires at least 10 characters", () => {
    const result = acceptInvitationSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" });
    expect(result.success || fieldErrors(result.error).password).toBe("Use at least 10 characters.");
  });

  it("requires the passwords to match", () => {
    const result = acceptInvitationSchema.safeParse({ ...valid, confirmPassword: "something else entirely" });
    expect(result.success || fieldErrors(result.error).confirmPassword).toBe("The passwords don't match.");
  });

  it("requires a name", () => {
    const result = acceptInvitationSchema.safeParse({ ...valid, name: "   " });
    expect(result.success || fieldErrors(result.error).name).toBe("Enter your name.");
  });
});

describe("signInSchema", () => {
  it("does not apply password rules at sign-in (older passwords still work)", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});
