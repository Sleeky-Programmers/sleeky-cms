/**
 * Headers for the public, read-only API (/api/public/*).
 *
 * Responses are never cached on the way (e.g. by Vercel's CDN). The website
 * keeps its own cache and asks again right after the CMS pings it about a
 * change; a CDN copy would hand it the previous version and the change wouldn't
 * show until that copy expired.
 */
export const PUBLIC_API_HEADERS = { "Cache-Control": "no-store" } as const;
