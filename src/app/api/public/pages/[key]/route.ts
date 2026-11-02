import { connection } from "next/server";
import { getPublicPage } from "@/lib/pages/store";

// Public, read-only: one page's text (original or edited), with rich text as HTML.
export async function GET(_request: Request, { params }: RouteContext<"/api/public/pages/[key]">) {
  await connection();
  const { key } = await params;
  const page = await getPublicPage(key);
  if (!page) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(
    { page },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
  );
}
