import { connection } from "next/server";
import { PUBLIC_API_HEADERS } from "@/lib/public-api";
import { getPublishedArticle } from "@/lib/insights/articles";

// Public, read-only: one published article (with its body as HTML) by slug.
export async function GET(_request: Request, { params }: RouteContext<"/api/public/insights/[slug]">) {
  await connection();
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(
    { article },
    { headers: PUBLIC_API_HEADERS },
  );
}
