"use server";

import { after } from "next/server";
import { PageError, resetPage, savePage, type PageState } from "@/lib/pages/store";
import { refreshWebsite } from "@/lib/revalidate";
import { requireUser } from "@/lib/session";

export type PageSaveResult =
  | { ok: true; page: PageState; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; conflict?: boolean };

function failure(error: unknown, fallback: string): PageSaveResult {
  if (error instanceof PageError) {
    return { ok: false, message: error.message, fieldErrors: error.fieldErrors, conflict: error.code === "conflict" };
  }
  console.error(fallback, error);
  return { ok: false, message: "Something went wrong. Your changes are still here; try again." };
}

/** Saves a page's text; it goes live on the website straight away. Any signed-in team member may do this. */
export async function savePageAction(key: string, values: unknown, version: string): Promise<PageSaveResult> {
  const user = await requireUser();
  try {
    const page = await savePage(key, values, version, { id: user.id, name: user.name });
    after(() => refreshWebsite([key], "pages"));
    return { ok: true, page, message: "Saved. The changes are live on the website." };
  } catch (error) {
    return failure(error, "Saving page failed");
  }
}

/** Puts a page back to the website's original text. */
export async function resetPageAction(key: string, version: string): Promise<PageSaveResult> {
  await requireUser();
  try {
    const page = await resetPage(key, version);
    after(() => refreshWebsite([key], "pages"));
    return { ok: true, page, message: "Back to the original text." };
  } catch (error) {
    return failure(error, "Resetting page failed");
  }
}
