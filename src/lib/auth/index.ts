import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { db, mongoClient } from "../db";
import { emailLayout, escapeHtml, sendEmail } from "../email";
import { env } from "../env";
import { PASSWORD_MAX, PASSWORD_MIN } from "../limits";
import { accessControl, roles } from "./access";

function createAuth() {
  const { APP_URL, BETTER_AUTH_SECRET } = env();

  return betterAuth({
    appName: "Sleeky CMS",
    baseURL: APP_URL,
    secret: BETTER_AUTH_SECRET,
    database: mongodbAdapter(db(), { client: mongoClient() }),

    emailAndPassword: {
      enabled: true,
      // Invite-only: accounts are created by accepting an invitation, never by signing up.
      disableSignUp: true,
      minPasswordLength: PASSWORD_MIN,
      maxPasswordLength: PASSWORD_MAX,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Reset your Sleeky CMS password",
          text: `Hi ${user.name},\n\nUse this link to choose a new password for Sleeky CMS. It expires in 1 hour.\n\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
          html: emailLayout({
            heading: "Reset your password",
            body: `<p style="margin:0;font-size:16px;line-height:1.6;color:#070B10">Hi ${escapeHtml(user.name)}, use the button below to choose a new password for Sleeky CMS. The link expires in 1 hour.</p>`,
            action: { label: "Choose a new password", url },
            footer: "If you didn't ask for this, you can ignore this email; your password won't change.",
          }),
        });
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh the expiry at most once a day
    },

    // In-memory limits don't survive serverless instances, so keep counts in MongoDB.
    rateLimit: {
      enabled: process.env.NODE_ENV === "production",
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 300, max: 3 },
        "/reset-password": { window: 300, max: 5 },
      },
    },

    plugins: [
      admin({
        ac: accessControl,
        roles,
        defaultRole: "editor",
        adminRoles: ["admin"],
        bannedUserMessage: "Your account has been deactivated. Contact an admin if you think this is a mistake.",
      }),
      // Must be last: lets auth.api calls in Server Actions set cookies.
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

/** The Better Auth instance, created on first use so builds don't need runtime secrets. */
export function auth(): Auth {
  if (!instance) instance = createAuth();
  return instance;
}
