import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// End-to-end checks of invites and sign-in against a real MongoDB, using a
// throwaway database that is dropped afterwards. Skipped when no MONGODB_URI.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const runId = Date.now().toString(36);
process.env.MONGODB_DB = `sleeky_cms_test_${runId}`;
process.env.APP_URL ??= "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-123";

const hasDatabase = !!process.env.MONGODB_URI;

describe.skipIf(!hasDatabase)("invites and sign-in (MongoDB)", () => {
  let lib: {
    invitations: typeof import("@/lib/invitations");
    users: typeof import("@/lib/users");
    auth: typeof import("@/lib/auth");
    db: typeof import("@/lib/db");
  };
  const password = "correct horse battery staple";
  const email = (name: string) => `${name}-${runId}@example.com`;

  beforeAll(async () => {
    lib = {
      invitations: await import("@/lib/invitations"),
      users: await import("@/lib/users"),
      auth: await import("@/lib/auth"),
      db: await import("@/lib/db"),
    };
  });

  afterAll(async () => {
    if (!lib) return;
    await lib.db.db().dropDatabase();
    await lib.db.mongoClient().close();
  });

  const signIn = (address: string, pass = password) =>
    lib.auth.auth().api.signInEmail({ body: { email: address, password: pass } });

  it("invites, accepts once, and signs in with the invited role", async () => {
    const { invitation, token } = await lib.invitations.createInvitation({
      email: email("ada"),
      role: "editor",
      invitedBy: { id: "x", name: "Test Admin" },
    });
    expect(invitation.status).toBe("pending");
    expect((await lib.invitations.findInvitationByToken(token))?.email).toBe(email("ada"));

    const accepted = await lib.invitations.acceptInvitation({ token, name: "Ada Okafor", password });
    const user = await lib.users.findUser(accepted.userId);
    expect(user).toMatchObject({ name: "Ada Okafor", email: email("ada"), role: "editor", active: true });

    const session = await signIn(email("ada"));
    expect(session.user.email).toBe(email("ada"));

    expect((await lib.invitations.findInvitationByToken(token))?.status).toBe("accepted");
    await expect(lib.invitations.acceptInvitation({ token, name: "Someone Else", password })).rejects.toMatchObject({
      code: "invalid-link",
    });
  });

  it("won't invite someone who already has an account", async () => {
    await expect(
      lib.invitations.createInvitation({ email: email("ada").toUpperCase(), role: "admin", invitedBy: null }),
    ).rejects.toMatchObject({ code: "already-a-user" });
  });

  it("re-inviting the same email cancels the earlier link", async () => {
    const first = await lib.invitations.createInvitation({ email: email("bola"), role: "editor", invitedBy: null });
    const second = await lib.invitations.createInvitation({ email: email("bola"), role: "admin", invitedBy: null });

    expect((await lib.invitations.findInvitationByToken(first.token))?.status).toBe("revoked");
    expect((await lib.invitations.findInvitationByToken(second.token))?.status).toBe("pending");
    await expect(lib.invitations.acceptInvitation({ token: first.token, name: "Bola", password })).rejects.toMatchObject({
      code: "invalid-link",
    });
  });

  it("rejects expired and cancelled invites, and renewing replaces the link", async () => {
    const expired = await lib.invitations.createInvitation({ email: email("chidi"), role: "editor", invitedBy: null });
    await lib.db
      .db()
      .collection("invitation")
      .updateOne({ email: email("chidi") , revokedAt: null }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await lib.invitations.findInvitationByToken(expired.token))?.status).toBe("expired");
    await expect(lib.invitations.acceptInvitation({ token: expired.token, name: "Chidi", password })).rejects.toMatchObject({
      code: "invalid-link",
    });

    const renewed = await lib.invitations.renewInvitation(expired.invitation.id);
    expect(renewed.invitation.status).toBe("pending");
    expect(await lib.invitations.findInvitationByToken(expired.token)).toBeNull();

    await lib.invitations.revokeInvitation(renewed.invitation.id);
    await expect(lib.invitations.acceptInvitation({ token: renewed.token, name: "Chidi", password })).rejects.toMatchObject({
      code: "invalid-link",
    });
    await expect(lib.invitations.renewInvitation(renewed.invitation.id)).rejects.toMatchObject({ code: "not-pending" });
  });

  it("has no public sign-up", async () => {
    await expect(
      lib.auth.auth().api.signUpEmail({ body: { email: email("intruder"), password, name: "Intruder" } }),
    ).rejects.toBeTruthy();
    expect(await lib.db.db().collection("user").countDocuments({ email: email("intruder") })).toBe(0);
  });

  it("rejects wrong passwords and deactivated users", async () => {
    await expect(signIn(email("ada"), "wrong password entirely")).rejects.toMatchObject({ statusCode: 401 });

    await lib.db.db().collection("user").updateOne({ email: email("ada") }, { $set: { banned: true } });
    await expect(signIn(email("ada"))).rejects.toMatchObject({ body: { code: "BANNED_USER" } });
    await lib.db.db().collection("user").updateOne({ email: email("ada") }, { $set: { banned: false } });
  });

  it("protects the last active admin", async () => {
    const first = await lib.invitations.createInvitation({ email: email("admin-one"), role: "admin", invitedBy: null });
    const { userId } = await lib.invitations.acceptInvitation({ token: first.token, name: "Admin One", password });
    const adminOne = (await lib.users.findUser(userId))!;

    // In this test database Admin One is the only admin (Bola's admin invite was never accepted).
    expect(await lib.users.wouldRemoveLastAdmin(adminOne, { role: "editor" })).toBe(true);
    expect(await lib.users.wouldRemoveLastAdmin(adminOne, { active: false })).toBe(true);

    const second = await lib.invitations.createInvitation({ email: email("admin-two"), role: "admin", invitedBy: null });
    await lib.invitations.acceptInvitation({ token: second.token, name: "Admin Two", password });
    expect(await lib.users.wouldRemoveLastAdmin(adminOne, { role: "editor" })).toBe(false);
  });
});
