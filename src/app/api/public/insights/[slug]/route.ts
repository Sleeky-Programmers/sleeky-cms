import { connection } from "next/server";
import { getPublishedArticle } from "@/lib/insights/articles";

// Public, read-only: one published article (with its body as HTML) by slug.
export async function GET(_request: Request, { params }: RouteContext<"/api/public/insights/[slug]">) {
  await connection();
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(
    { article },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
  );
}
