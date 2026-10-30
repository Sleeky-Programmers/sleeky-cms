import { ObjectId } from "mongodb";
import { isRole, type Role } from "./auth/roles";
import { db } from "./db";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
};

type UserDoc = {
  _id: ObjectId;
  name: string;
  email: string;
  role?: string;
  banned?: boolean | null;
  createdAt: Date;
};

// Users are stored by Better Auth; deactivated users are "banned" in its terms.
const users = () => db().collection<UserDoc>("user");

const toSummary = (doc: UserDoc): UserSummary => ({
  id: doc._id.toHexString(),
  name: doc.name,
  email: doc.email,
  role: isRole(doc.role) ? doc.role : "editor",
  active: !doc.banned,
  createdAt: doc.createdAt,
});

export async function listUsers(): Promise<UserSummary[]> {
  const docs = await users().find({}).sort({ createdAt: 1 }).toArray();
  return docs.map(toSummary);
}

export async function findUser(id: string): Promise<UserSummary | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await users().findOne({ _id: new ObjectId(id) });
  return doc ? toSummary(doc) : null;
}

export async function countActiveAdmins(): Promise<number> {
  return users().countDocuments({ role: "admin", banned: { $ne: true } });
}

/**
 * True when this change would leave the CMS with no active admin, which would
 * lock everyone out of user management.
 */
export async function wouldRemoveLastAdmin(target: UserSummary, change: { role?: Role; active?: boolean }) {
  if (target.role !== "admin" || !target.active) return false;
  const losesAdmin = (change.role !== undefined && change.role !== "admin") || change.active === false;
  return losesAdmin && (await countActiveAdmins()) <= 1;
}
