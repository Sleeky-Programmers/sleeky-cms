import { connection } from "next/server";
import { listPublishedCaseStudies } from "@/lib/case-studies/store";

// Public, read-only: published case studies in website order.
export async function GET() {
  await connection();
  return Response.json(
    { caseStudies: await listPublishedCaseStudies() },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
  );
}
