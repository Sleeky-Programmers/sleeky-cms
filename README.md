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

- **Roles:** *Admin* manages users and invites, plus everything editors can do. *Editor* works on content.
- **Invites:** admins invite people from **Users**. Each invite link works once and expires after 7 days. Re-inviting the same email cancels the earlier link. Admins can resend (which issues a fresh link) or cancel pending invites.
- **Deactivating** a user signs them out everywhere and blocks sign-in; reactivating restores access. Accounts are never hard-deleted.
- **Safeguards:** admins can't change their own role or deactivate themselves, and the last active admin can't be demoted or deactivated.
- **Passwords:** at least 10 characters. "Forgot your password?" emails a reset link that expires after 1 hour and signs the account out of every other session.
- Sign-in and password-reset attempts are rate limited in production.

## Insights articles

Everyone signed in can write, save drafts, preview, publish, update and unpublish articles from **Insights**.

- **Drafts** only need a title. **Publishing** also needs a web address, a summary (20+ characters), a category, some body text and, if there's a cover image, a description of it.
- The **web address** follows the title until you edit it or the article is first published. Changing the address of a live article breaks existing links, and the editor warns about it.
- **Saving a published article** updates it on the website straight away (the button says *Update*). *Unpublish* takes it down and makes it a draft again; the first-published date is kept.
- Only **drafts** can be deleted, so nothing disappears from the website by accident.
- If someone else saved the article after you opened it, your save is refused instead of overwriting theirs.
- **Images** upload straight from the browser to Cloudinary (JPG, PNG, WebP, GIF or AVIF, up to 10 MB). Without Cloudinary settings, uploads are turned off.
- Article bodies are cleaned on every save: only the editor's formatting is kept, links must be web/email/phone links and images must come from our Cloudinary account.

### Public API for the website

Read-only and unauthenticated; only published articles, no internal fields.

| Endpoint | Returns |
|---|---|
| `GET /api/public/insights` | `{ articles: [...] }`: slug, title, excerpt, metaDescription, category, author, publishedAt, updatedAt, readingMinutes, coverImage |
| `GET /api/public/insights/<slug>` | `{ article }`: the same plus `html` (the article body), or 404 |

When an article is published, updated or unpublished, the CMS POSTs `{ "type": "insights", "slugs": [...] }` to `WEBSITE_REVALIDATE_URL` with `Authorization: Bearer <REVALIDATE_SECRET>`, so the website can refresh its cache right away.

## Case studies

Everyone signed in can create, edit, publish, unpublish and reorder the projects on the website's Work pages from **Case studies**.

- **Import from the website:** when the list is empty, one click copies the projects the website currently shows (Votely, straitPay, Tiqwa Travels) in the same order, already published, so nothing disappears when the website switches to the CMS.
- **Sections** follow the case study template: overview (client, summary, service tags, sector, live link, card colour), screenshots, the challenge, what we built, features, results, client quote, related services and search results. Empty optional sections are hidden on the website.
- **Drafts** only need a client name. **Publishing** also needs a valid web address, a summary (20+ characters), at least one service tag, and the "What we built" headline and text. A challenge or quote must be complete or left empty, and every screenshot needs a description.
- **Order:** use ↑/↓ on the list. The order is the website's order, and it decides each page's "Next project" link. New case studies go to the end.
- **Preview** shows the last saved version laid out like the website's case study page, including drafts and placeholders for missing screenshots.
- The web address follows the client name until you edit it or the case study is first published. Same safeguards as articles: only drafts can be deleted, and a save is refused if someone else saved after you opened it.

| Endpoint | Returns |
|---|---|
| `GET /api/public/case-studies` | `{ caseStudies: [...] }`: published, in website order |
| `GET /api/public/case-studies/<slug>` | `{ caseStudy, next }`: `next` is `{ slug, client }` of the following project (wrapping around), or 404 |

Each case study has the same shape as the website's `CaseStudy` type (`src/lib/content/types.ts`), plus `publishedAt` and `updatedAt`. Images are `{ src, alt, width, height }`, and empty optional fields are left out. After a change, the CMS POSTs `{ "type": "case-studies", "slugs": [...] }` to `WEBSITE_REVALIDATE_URL`.

## Page content

Everyone signed in can edit the website's own text from **Pages**: the homepage, About, Privacy policy, the six service pages, and **Site settings** (contact details, address, social links and footer text shared by every page).

- Every page starts with the **website's current text**. Only pages someone has edited are stored; the list shows *Edited* or *Original text*.
- **Saving goes live straight away.** There are no drafts for page text. *Reset to original text* discards all edits to that page.
- Each field has limits that match the design (character counts, number of list items), so edits can't break the layout. Some lists need an exact number of entries, e.g. the four homepage process steps.
- In **headings**, each new line is a new line on the website, and `*words between asterisks*` are shown in the green accent colour.
- A service page's **Related work** is chosen from the case studies in the CMS, or "None" to hide it. A draft only shows on the website once it's published.
- Phone and WhatsApp numbers use the international format (`+2349160952000` for phone, `2349160952000` for WhatsApp). Links must start with `http://` or `https://`.
- Same safeguards as articles: if someone else saved the page after you opened it, your save is refused; rich text (the privacy policy) is cleaned on save.

Page keys: `home`, `about`, `privacy-policy`, `site`, and `service-<slug>` for each service (`service-websites`, `service-business-automation`, …).

| Endpoint | Returns |
|---|---|
| `GET /api/public/pages` | `{ pages: [...] }`: key, title, group, websitePath, updatedAt |
| `GET /api/public/pages/<key>` | `{ page }`: key, updatedAt and `content` (rich text as `{ html }`), or 404 |

After a save or reset, the CMS POSTs `{ "type": "pages", "slugs": ["<key>"] }` to `WEBSITE_REVALIDATE_URL`, the same way as for articles.

## Environment variables

See [`.env.example`](.env.example). Summary:

| Variable | Required | Purpose |
|---|---|---|
| `APP_URL` | Yes | Public URL of the CMS, used in invite and reset links |
| `MONGODB_URI` | Yes | MongoDB connection string (uses the database named in it) |
| `BETTER_AUTH_SECRET` | Yes | Signs sessions; at least 32 random characters, different per environment |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM` | In production | SMTP for invite and reset emails. In development, emails are printed to the terminal instead |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | For images | Image uploads (Cloudinary console > Settings > API Keys). Files go to `sleeky-cms/insights`, `sleeky-cms/case-studies` or `sleeky-cms/pages` |
| `WEBSITE_REVALIDATE_URL`, `REVALIDATE_SECRET` | No | Refresh the website as soon as articles, case studies or pages change (see above). Use a stable address (live domain or branch alias), not a one-off deployment URL |
| `WEBSITE_PROTECTION_BYPASS` | For preview websites | The website project's Vercel *Protection Bypass for Automation* secret, so pings get past Vercel's login on previews. Failed pings are logged with the reason |
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
    (cms)/         Signed-in area: dashboard, insights, case studies, pages, users (admins)
    api/auth/      Better Auth endpoints
    api/public/    Read-only published content for the website
  components/      UI, auth forms, article, case study and page editors, users management
  lib/
    auth/          Better Auth config, roles and permissions
    case-studies/  Case studies: fields, the website's originals, storage and publishing checks
    insights/      Articles: storage, validation, body sanitizing and HTML rendering
    pages/         Page content: field schemas, the website's original text, validation, storage
    revalidate.ts  Website refresh ping
    images.ts      Cloudinary settings and image checks
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
