import { env } from "./env";

/**
 * Asks the website to refresh its cached content after articles, case studies
 * or pages change, so changes show within seconds instead of at the next cache
 * expiry. Best effort: a failure is logged and never blocks saving.
 */
export async function refreshWebsite(slugs: string[], type: "insights" | "pages" | "case-studies" = "insights") {
  const { WEBSITE_REVALIDATE_URL, REVALIDATE_SECRET, WEBSITE_PROTECTION_BYPASS } = env();
  if (!WEBSITE_REVALIDATE_URL || !REVALIDATE_SECRET || slugs.length === 0) return;
  try {
    const response = await fetch(WEBSITE_REVALIDATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${REVALIDATE_SECRET}`,
        // Lets the ping through Vercel's login on protected (preview) deployments.
        ...(WEBSITE_PROTECTION_BYPASS ? { "x-vercel-protection-bypass": WEBSITE_PROTECTION_BYPASS } : {}),
      },
      // For pages, "slugs" are page keys (e.g. "home", "service-websites", "site").
      body: JSON.stringify({ type, slugs }),
      // A redirect means the ping didn't reach the website (e.g. Vercel's login page),
      // so don't follow it and quietly count the login page as success.
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error(`Website refresh failed (${response.status})${refreshHint(response)}`);
  } catch (error) {
    console.error("Website refresh failed", error);
  }
}

function refreshHint(response: Response): string {
  const location = response.headers.get("location") ?? "";
  if (response.status >= 300 && response.status < 400 && location.includes("vercel.com")) {
    return ": the website deployment is behind Vercel's login. Set WEBSITE_PROTECTION_BYPASS to the website project's Protection Bypass for Automation secret.";
  }
  if (response.status === 401) return ": the website rejected REVALIDATE_SECRET (it must match the website's).";
  if (response.status === 404) return ": no /api/revalidate at WEBSITE_REVALIDATE_URL (wrong address, or a deployment from before the CMS integration).";
  return "";
}
