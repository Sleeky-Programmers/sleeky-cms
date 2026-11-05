import { env } from "./env";

/** The public website's address (from WEBSITE_REVALIDATE_URL), for "View on website" links. */
export function websiteOrigin(): string | undefined {
  const { WEBSITE_REVALIDATE_URL } = env();
  return WEBSITE_REVALIDATE_URL ? new URL(WEBSITE_REVALIDATE_URL).origin : undefined;
}
