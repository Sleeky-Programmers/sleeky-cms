import { connection } from "next/server";
import { listPublishedArticles } from "@/lib/insights/articles";

// Public, read-only: published articles for the website's Insights page.
// No drafts, no internal fields. The website caches responses and is told to
// refresh when something is published or changed.
export async function GET() {
  await connection();
  const articles = await listPublishedArticles();
  return Response.json(
    { articles },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
  );
}
