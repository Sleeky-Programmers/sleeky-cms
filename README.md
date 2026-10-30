# Sleeky CMS

Content management for [sleekyprogrammers.com](https://sleekyprogrammers.com): Insights articles, case studies and page content, edited by the Sleeky team.

Built with Next.js 16 (App Router, Cache Components), TypeScript and Tailwind CSS, using the same brand tokens and fonts as the website. Data lives in MongoDB; sign-in uses [Better Auth](https://www.better-auth.com).

## Getting started

Requires Node.js 20.9 or later and a MongoDB database (MongoDB Atlas).

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be sent to the sign-in screen.

### Creating the first admin

There is no public sign-up: every account starts as an invite. Create the first admin from the command line:

```bash
npm run invite-admin -- you@sleekyprogrammers.com
```

It prints an invite link (and emails it when SMTP is configured). Open it, choose your name and password, and you're in. Use the same command to recover access if every admin is ever locked out.

## Accounts and access

- **Roles:** *Admin* manages users and invites, plus everything editors can do. *Editor* works on content (coming in later features).
- **Invites:** admins invite people from **Users**. Each invite link works once and expires after 7 days. Re-inviting the same email cancels the earlier link. Admins can resend (which issues a fresh link) or cancel pending invites.
- **Deactivating** a user signs them out everywhere and blocks sign-in; reactivating restores access. Accounts are never hard-deleted.
- **Safeguards:** admins can't change their own role or deactivate themselves, and the last active admin can't be demoted or deactivated.
- **Passwords:** at least 10 characters. "Forgot your password?" emails a reset link that expires after 1 hour and signs the account out of every other session.
- Sign-in and password-reset attempts are rate limited in production.

## Environment variables

See [`.env.example`](.env.example). Summary:

| Variable | Required | Purpose |
|---|---|---|
| `APP_URL` | Yes | Public URL of the CMS, used in invite and reset links |
| `MONGODB_URI` | Yes | MongoDB connection string (uses the database named in it) |
| `BETTER_AUTH_SECRET` | Yes | Signs sessions; at least 32 random characters, different per environment |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM` | In production | SMTP for invite and reset emails. In development, emails are printed to the terminal instead |
| `MONGODB_DNS_SERVERS` | No | Only for machines whose DNS refuses `mongodb+srv` lookups (`querySrv ECONNREFUSED`), e.g. `1.1.1.1,8.8.8.8` |
| `MONGODB_DB` | No | Overrides the database name (used by tests) |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint with ESLint |
| `npm run typecheck` | Generate route types and type-check |
| `npm test` | Unit tests, plus integration tests against a throwaway MongoDB database (dropped afterwards; skipped without `MONGODB_URI`) |
| `npm run invite-admin -- <email>` | Create an admin invite from the command line |

## Project structure

```
src/
  app/
    (auth)/        Public screens: sign-in, forgot/reset password, accept invite
    (cms)/         Signed-in area: dashboard, users (admins)
    api/auth/      Better Auth endpoints
  components/      UI, auth forms, users management
  lib/
    auth/          Better Auth config, roles and permissions
    session.ts     Data Access Layer: the only place sessions are read and checked
    invitations.ts Invite lifecycle (create, renew, revoke, accept)
    users.ts       User listing and last-admin safeguard
  proxy.ts         Quick redirect to sign-in when there's no session cookie
scripts/           Command-line tools (invite-admin)
tests/             Integration tests
```

Every page and Server Action checks the session itself through `src/lib/session.ts`; the proxy only makes the redirect faster.

## Branches

- `main`: production
- `develop`: integration branch for the next release
- `feature/*`: one branch per feature, merged into `develop`

## Notes

- The CMS is private: every page and response is marked `noindex`.
- `AGENTS.md` is generated and kept up to date by Next.js for coding agents; leave it in place.
