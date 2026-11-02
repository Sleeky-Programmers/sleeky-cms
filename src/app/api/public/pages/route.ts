import { connection } from "next/server";
import { listPublicPages } from "@/lib/pages/store";

// Public, read-only: the editable pages and when each was last changed.
export async function GET() {
  await connection();
  return Response.json(
    { pages: await listPublicPages() },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
  );
}
