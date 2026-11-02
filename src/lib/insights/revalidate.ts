import { env } from "../env";

/**
 * Asks the website to refresh its cached articles after a publish, update or
 * unpublish, so changes show within seconds instead of at the next cache expiry.
 * Best effort: a failure is logged and never blocks saving.
 */
export async function refreshWebsite(slugs: string[]) {
  const { WEBSITE_REVALIDATE_URL, REVALIDATE_SECRET } = env();
  if (!WEBSITE_REVALIDATE_URL || !REVALIDATE_SECRET || slugs.length === 0) return;
  try {
    const response = await fetch(WEBSITE_REVALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${REVALIDATE_SECRET}` },
      body: JSON.stringify({ type: "insights", slugs }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error(`Website refresh failed (${response.status})`);
  } catch (error) {
    console.error("Website refresh failed", error);
  }
}
