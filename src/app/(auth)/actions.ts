"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAPIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import type { FormState } from "@/lib/form-state";
import { acceptInvitation, InvitationError } from "@/lib/invitations";
import { safeRedirectPath } from "@/lib/security";
import { acceptInvitationSchema, fieldErrors, forgotPasswordSchema, newPasswordSchema, signInSchema } from "@/lib/validation";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

const TOO_MANY = "Too many attempts. Wait a few minutes and try again.";

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({ email: values.email, password: text(formData, "password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    await auth().api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password, rememberMe: true },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) {
      if (error.body?.code === "BANNED_USER") return { message: error.message, tone: "error", values };
      if (error.statusCode === 429) return { message: TOO_MANY, tone: "error", values };
      // Same message whether the email exists or not, so accounts can't be discovered.
      return { message: "Incorrect email or password.", tone: "error", values };
    }
    throw error;
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    await auth().api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo: `${env().APP_URL}/reset-password` },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error) && error.statusCode === 429) return { message: TOO_MANY, tone: "error", values };
    // Don't reveal failures that could hint whether the account exists; log for the team.
    console.error("Password reset request failed", error);
  }

  return {
    tone: "success",
    message: "If there's an account for that email, we've sent a link to reset the password. It expires in 1 hour.",
  };
}

export async function resetPassword(_: FormState, formData: FormData): Promise<FormState> {
  const token = text(formData, "token");
  const parsed = newPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  try {
    await auth().api.resetPassword({
      body: { newPassword: parsed.data.password, token },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) {
      if (error.statusCode === 429) return { message: TOO_MANY, tone: "error" };
      return { message: "This reset link has expired or was already used. Request a new one.", tone: "error" };
    }
    throw error;
  }

  redirect("/sign-in?reset=done");
}

export async function acceptInvite(_: FormState, formData: FormData): Promise<FormState> {
  const values = { name: text(formData, "name") };
  const parsed = acceptInvitationSchema.safeParse({
    token: text(formData, "token"),
    name: values.name,
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  let email: string;
  try {
    ({ email } = await acceptInvitation(parsed.data));
  } catch (error) {
    if (error instanceof InvitationError) return { message: error.message, tone: "error", values };
    if (isAPIError(error)) return { message: error.message, tone: "error", values };
    throw error;
  }

  try {
    await auth().api.signInEmail({
      body: { email, password: parsed.data.password, rememberMe: true },
      headers: await headers(),
    });
  } catch {
    // The account exists; if signing in fails for any reason, let them sign in by hand.
    redirect("/sign-in?invited=done");
  }

  redirect("/");
}
