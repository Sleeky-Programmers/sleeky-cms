// Creates an admin invite from the command line, for the very first admin (or
// to recover access if every admin is locked out). Prints the invite link and
// also emails it when SMTP is configured.
//
//   npm run invite-admin -- you@sleekyprogrammers.com

import { mongoClient } from "../src/lib/db";
import { createInvitation, InvitationError, invitationUrl, sendInvitationEmail } from "../src/lib/invitations";
import { emailSchema } from "../src/lib/validation";

async function main() {
  const parsed = emailSchema.safeParse(process.argv[2] ?? "");
  if (!parsed.success) {
    console.error("Usage: npm run invite-admin -- <email>");
    process.exitCode = 1;
    return;
  }

  try {
    const { invitation, token } = await createInvitation({ email: parsed.data, role: "admin", invitedBy: null });
    try {
      if (await sendInvitationEmail(invitation, token)) console.log(`Invite emailed to ${invitation.email}.`);
      else console.log("Email isn't set up, so the invite wasn't emailed. Share the link below.");
    } catch (error) {
      console.warn(`Couldn't email the invite (${error instanceof Error ? error.message : error}). Share the link yourself.`);
    }
    console.log(`\nAdmin invite for ${invitation.email} (expires ${invitation.expiresAt.toUTCString()}):\n${invitationUrl(token)}\n`);
  } catch (error) {
    if (error instanceof InvitationError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  } finally {
    await mongoClient().close();
  }
}

main();
