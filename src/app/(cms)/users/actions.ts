"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { isAPIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { FormState } from "@/lib/form-state";
import {
  createInvitation,
  InvitationError,
  invitationUrl,
  renewInvitation,
  revokeInvitation,
  sendInvitationEmail,
  type Invitation,
} from "@/lib/invitations";
import { requireAdmin } from "@/lib/session";
import { findUser, wouldRemoveLastAdmin } from "@/lib/users";
import { fieldErrors, inviteSchema, roleSchema } from "@/lib/validation";

// Every action re-checks the caller is an admin: Server Actions are public
// endpoints, so the page being admin-only isn't enough on its own.

async function deliver(invitation: Invitation, token: string): Promise<FormState> {
  const link = invitationUrl(token);
  try {
    const emailed = await sendInvitationEmail(invitation, token);
    return emailed
      ? { tone: "success", message: `Invite sent to ${invitation.email}.`, link }
      : { tone: "success", message: `Invite created for ${invitation.email}. Email isn't set up here, so copy the link below and send it yourself.`, link };
  } catch (error) {
    console.error("Invite email failed", error);
    return {
      tone: "error",
      message: `The invite for ${invitation.email} was created, but the email couldn't be sent. Copy the link below and send it yourself.`,
      link,
    };
  }
}

export async function inviteUser(_: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = { email: String(formData.get("email") ?? ""), role: String(formData.get("role") ?? "editor") };
  const parsed = inviteSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    const { invitation, token } = await createInvitation({
      email: parsed.data.email,
      role: parsed.data.role,
      invitedBy: { id: admin.id, name: admin.name },
    });
    const result = await deliver(invitation, token);
    refresh();
    return result;
  } catch (error) {
    if (error instanceof InvitationError) return { errors: { email: error.message }, values };
    throw error;
  }
}

export async function resendInvite(id: string): Promise<FormState> {
  await requireAdmin();
  try {
    const { invitation, token } = await renewInvitation(id);
    const result = await deliver(invitation, token);
    refresh();
    return result;
  } catch (error) {
    if (error instanceof InvitationError) return { tone: "error", message: error.message };
    throw error;
  }
}

export async function cancelInvite(id: string): Promise<FormState> {
  await requireAdmin();
  try {
    await revokeInvitation(id);
  } catch (error) {
    if (error instanceof InvitationError) return { tone: "error", message: error.message };
    throw error;
  }
  refresh();
  return { tone: "success", message: "Invite cancelled." };
}

export async function changeRole(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const role = roleSchema.safeParse(formData.get("role"));
  if (!role.success) return { tone: "error", message: "Choose a valid role." };

  if (userId === admin.id) return { tone: "error", message: "You can't change your own role." };
  const target = await findUser(userId);
  if (!target) return { tone: "error", message: "This user no longer exists." };
  if (target.role === role.data) return {};
  if (await wouldRemoveLastAdmin(target, { role: role.data })) {
    return { tone: "error", message: "There must always be at least one active admin." };
  }

  try {
    await auth().api.setRole({ body: { userId, role: role.data }, headers: await headers() });
  } catch (error) {
    if (isAPIError(error)) return { tone: "error", message: error.message };
    throw error;
  }
  refresh();
  return { tone: "success", message: `${target.name} is now an ${ROLE_LABELS[role.data]}.` };
}

export async function setUserActive(userId: string, active: boolean): Promise<FormState> {
  const admin = await requireAdmin();
  if (userId === admin.id) return { tone: "error", message: "You can't deactivate your own account." };
  const target = await findUser(userId);
  if (!target) return { tone: "error", message: "This user no longer exists." };
  if (target.active === active) return {};
  if (await wouldRemoveLastAdmin(target, { active })) {
    return { tone: "error", message: "There must always be at least one active admin." };
  }

  try {
    const requestHeaders = await headers();
    if (active) {
      await auth().api.unbanUser({ body: { userId }, headers: requestHeaders });
    } else {
      // Deactivating also signs the user out everywhere.
      await auth().api.banUser({ body: { userId, banReason: `Deactivated by ${admin.name}` }, headers: requestHeaders });
    }
  } catch (error) {
    if (isAPIError(error)) return { tone: "error", message: error.message };
    throw error;
  }
  refresh();
  return { tone: "success", message: active ? `${target.name} can sign in again.` : `${target.name} has been deactivated and signed out.` };
}
