import { connection } from "next/server";
import { PUBLIC_API_HEADERS } from "@/lib/public-api";
import { listPublishedCaseStudies } from "@/lib/case-studies/store";

// Public, read-only: published case studies in website order.
export async function GET() {
  await connection();
  return Response.json(
    { caseStudies: await listPublishedCaseStudies() },
    { headers: PUBLIC_API_HEADERS },
  );
}
