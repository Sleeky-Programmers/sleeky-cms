import { connection } from "next/server";
import { PUBLIC_API_HEADERS } from "@/lib/public-api";
import { listPublicPages } from "@/lib/pages/store";

// Public, read-only: the editable pages and when each was last changed.
export async function GET() {
  await connection();
  return Response.json(
    { pages: await listPublicPages() },
    { headers: PUBLIC_API_HEADERS },
  );
}
