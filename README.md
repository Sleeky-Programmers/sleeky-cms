# Sleeky CMS

Content management for [sleekyprogrammers.com](https://sleekyprogrammers.com): Insights articles, case studies and page content, edited by the Sleeky team without a developer.

Built with Next.js (App Router), TypeScript and Tailwind CSS, using the same brand tokens and fonts as the website.

## Getting started

Requires Node.js 20 or later.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint with ESLint |
| `npm run typecheck` | Type-check with TypeScript |

## Branches

- `main`: production
- `develop`: integration branch for the next release
- `feature/*`: one branch per feature, merged into `develop`

## Notes

- The CMS is private: every page and response is marked `noindex`.
- `AGENTS.md` is generated and kept up to date by Next.js for coding agents; leave it in place.
