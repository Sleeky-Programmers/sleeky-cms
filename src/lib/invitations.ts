import { ObjectId, type Collection } from "mongodb";
import { auth } from "./auth";
import { ROLE_LABELS, type Role } from "./auth/roles";
import { db } from "./db";
import { emailLayout, escapeHtml, sendEmail } from "./email";
import { env } from "./env";
import { generateToken, hashToken } from "./security";

export const INVITATION_TTL_DAYS = 7;

export type InvitationStatus = "pending" | "expired" | "accepted" | "revoked";

type InvitationDoc = {
  _id: ObjectId;
  email: string;
  role: Role;
  tokenHash: string;
  invitedBy: { id: string; name: string } | null;
  createdAt: Date;
  lastSentAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  acceptedUserId: string | null;
  revokedAt: Date | null;
};

export type Invitation = {
  id: string;
  email: string;
  role: Role;
  invitedBy: { id: string; name: string } | null;
  createdAt: Date;
  lastSentAt: Date;
  expiresAt: Date;
  status: InvitationStatus;
};

export class InvitationError extends Error {
  constructor(
    readonly code: "already-a-user" | "not-found" | "not-pending" | "invalid-link",
    message: string,
  ) {
    super(message);
  }
}

let indexesReady: Promise<unknown> | undefined;

async function invitations(): Promise<Collection<InvitationDoc>> {
  const collection = db().collection<InvitationDoc>("invitation");
  indexesReady ??= Promise.all([
    collection.createIndex({ tokenHash: 1 }, { unique: true }),
    collection.createIndex({ email: 1, acceptedAt: 1, revokedAt: 1 }),
  ]).catch((error) => {
    indexesReady = undefined;
    throw error;
  });
  await indexesReady;
  return collection;
}

function statusOf(doc: InvitationDoc, now = new Date()): InvitationStatus {
  if (doc.acceptedAt) return "accepted";
  if (doc.revokedAt) return "revoked";
  if (doc.expiresAt <= now) return "expired";
  return "pending";
}

function toInvitation(doc: InvitationDoc): Invitation {
  return {
    id: doc._id.toHexString(),
    email: doc.email,
    role: doc.role,
    invitedBy: doc.invitedBy,
    createdAt: doc.createdAt,
    lastSentAt: doc.lastSentAt,
    expiresAt: doc.expiresAt,
    status: statusOf(doc),
  };
}

const expiry = (from: Date) => new Date(from.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

export function invitationUrl(token: string) {
  return `${env().APP_URL}/invite/${token}`;
}

async function userExists(email: string) {
  return (await db().collection("user").countDocuments({ email }, { limit: 1 })) > 0;
}

/**
 * Creates an invitation and returns it with the plain token (only ever held in
 * memory and in the emailed link). Any earlier pending invite for the same
 * email is revoked, so only the newest link works.
 */
export async function createInvitation(input: { email: string; role: Role; invitedBy: { id: string; name: string } | null }) {
  const email = input.email.trim().toLowerCase();
  if (await userExists(email)) {
    throw new InvitationError("already-a-user", "Someone with this email already has an account.");
  }

  const collection = await invitations();
  const now = new Date();
  await collection.updateMany({ email, acceptedAt: null, revokedAt: null }, { $set: { revokedAt: now } });

  const token = generateToken();
  const doc: InvitationDoc = {
    _id: new ObjectId(),
    email,
    role: input.role,
    tokenHash: hashToken(token),
    invitedBy: input.invitedBy,
    createdAt: now,
    lastSentAt: now,
    expiresAt: expiry(now),
    acceptedAt: null,
    acceptedUserId: null,
    revokedAt: null,
  };
  await collection.insertOne(doc);
  return { invitation: toInvitation(doc), token };
}

/** Issues a fresh link (and expiry) for an invite that hasn't been accepted or revoked. */
export async function renewInvitation(id: string) {
  if (!ObjectId.isValid(id)) throw new InvitationError("not-found", "This invite no longer exists.");
  const collection = await invitations();
  const now = new Date();
  const token = generateToken();
  const doc = await collection.findOneAndUpdate(
    { _id: new ObjectId(id), acceptedAt: null, revokedAt: null },
    { $set: { tokenHash: hashToken(token), lastSentAt: now, expiresAt: expiry(now) } },
    { returnDocument: "after" },
  );
  if (!doc) throw new InvitationError("not-pending", "This invite has already been accepted or cancelled.");
  return { invitation: toInvitation(doc), token };
}

export async function revokeInvitation(id: string) {
  if (!ObjectId.isValid(id)) throw new InvitationError("not-found", "This invite no longer exists.");
  const collection = await invitations();
  const result = await collection.updateOne(
    { _id: new ObjectId(id), acceptedAt: null, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  if (result.matchedCount === 0) {
    throw new InvitationError("not-pending", "This invite has already been accepted or cancelled.");
  }
}

/** Invites still waiting to be accepted, including expired ones (so they can be resent). */
export async function listOpenInvitations(): Promise<Invitation[]> {
  const collection = await invitations();
  const docs = await collection.find({ acceptedAt: null, revokedAt: null }).sort({ createdAt: -1 }).toArray();
  return docs.map(toInvitation);
}

/** Looks up an invite from the token in its link. */
export async function findInvitationByToken(token: string): Promise<Invitation | null> {
  if (!token) return null;
  const collection = await invitations();
  const doc = await collection.findOne({ tokenHash: hashToken(token) });
  return doc ? toInvitation(doc) : null;
}

/**
 * Accepts an invite: claims it atomically (so one link can only ever create one
 * account), then creates the user with the invited role. If creating the user
 * fails, the claim is released so the link can be used again.
 */
export async function acceptInvitation(input: { token: string; name: string; password: string }) {
  const collection = await invitations();
  const now = new Date();
  const claimed = await collection.findOneAndUpdate(
    { tokenHash: hashToken(input.token), acceptedAt: null, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { acceptedAt: now } },
    { returnDocument: "after" },
  );
  if (!claimed) {
    throw new InvitationError("invalid-link", "This invite link is no longer valid. Ask an admin to send a new one.");
  }

  try {
    const { user } = await auth().api.createUser({
      body: {
        email: claimed.email,
        name: input.name,
        password: input.password,
        role: claimed.role,
        // Following the emailed link proves they own the address.
        data: { emailVerified: true },
      },
    });
    await collection.updateOne({ _id: claimed._id }, { $set: { acceptedUserId: user.id } });
    return { email: claimed.email, userId: user.id };
  } catch (error) {
    await collection.updateOne({ _id: claimed._id }, { $set: { acceptedAt: null } });
    throw error;
  }
}

/** @returns true if the invite was emailed, false if email isn't configured (development). */
export async function sendInvitationEmail(invitation: Invitation, token: string): Promise<boolean> {
  const url = invitationUrl(token);
  const inviter = invitation.invitedBy?.name ?? "The Sleeky team";
  const role = ROLE_LABELS[invitation.role];
  return sendEmail({
    to: invitation.email,
    subject: "You're invited to Sleeky CMS",
    text: `${inviter} has invited you to Sleeky CMS as an ${role}.\n\nSet up your account here (the link expires in ${INVITATION_TTL_DAYS} days):\n\n${url}`,
    html: emailLayout({
      heading: "You're invited to Sleeky CMS",
      body: `<p style="margin:0;font-size:16px;line-height:1.6;color:#070B10">${escapeHtml(inviter)} has invited you to manage content on sleekyprogrammers.com as an <strong>${escapeHtml(role)}</strong>. Choose your name and password to get started. The link expires in ${INVITATION_TTL_DAYS} days.</p>`,
      action: { label: "Set up my account", url },
      footer: "If you weren't expecting this invite, you can ignore this email.",
    }),
  });
}
