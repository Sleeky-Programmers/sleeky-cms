import { connection } from "next/server";
import { PUBLIC_API_HEADERS } from "@/lib/public-api";
import { getPublishedCaseStudy } from "@/lib/case-studies/store";

// Public, read-only: one published case study by slug, plus the next one for "Next project".
export async function GET(_request: Request, { params }: RouteContext<"/api/public/case-studies/[slug]">) {
  await connection();
  const { slug } = await params;
  const result = await getPublishedCaseStudy(slug);
  if (!result) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(result, { headers: PUBLIC_API_HEADERS });
}
