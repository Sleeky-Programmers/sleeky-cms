import { env } from "./env";

/**
 * Asks the website to refresh its cached content after articles or pages change,
 * so changes show within seconds instead of at the next cache expiry.
 * Best effort: a failure is logged and never blocks saving.
 */
export async function refreshWebsite(slugs: string[], type: "insights" | "pages" = "insights") {
  const { WEBSITE_REVALIDATE_URL, REVALIDATE_SECRET } = env();
  if (!WEBSITE_REVALIDATE_URL || !REVALIDATE_SECRET || slugs.length === 0) return;
  try {
    const response = await fetch(WEBSITE_REVALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${REVALIDATE_SECRET}` },
      // For pages, "slugs" are page keys (e.g. "home", "service-websites", "site").
      body: JSON.stringify({ type, slugs }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error(`Website refresh failed (${response.status})`);
  } catch (error) {
    console.error("Website refresh failed", error);
  }
}
