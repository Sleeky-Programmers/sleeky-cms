"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import {
  CaseStudyError,
  deleteCaseStudy,
  importWebsiteCaseStudies,
  moveCaseStudy,
  saveCaseStudy,
  type CaseStudy,
  type SaveIntent,
} from "@/lib/case-studies/store";
import { refreshWebsite } from "@/lib/revalidate";
import { requireUser } from "@/lib/session";

export type CaseStudySaveResult =
  | { ok: true; caseStudy: CaseStudy; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; conflict?: boolean };

const SAVED_MESSAGES: Record<SaveIntent, (wentLive: boolean, status: CaseStudy["status"]) => string> = {
  save: (_, status) => (status === "published" ? "Changes are live on the website." : "Draft saved."),
  publish: (wentLive) => (wentLive ? "Published. It's live on the website." : "Changes are live on the website."),
  unpublish: () => "Unpublished. It's back to a draft and no longer on the website.",
};

/** Saves, publishes, updates or unpublishes a case study. Any signed-in team member may do all of these. */
export async function saveCaseStudyAction(input: unknown, intent: SaveIntent): Promise<CaseStudySaveResult> {
  const user = await requireUser();
  if (!["save", "publish", "unpublish"].includes(intent)) return { ok: false, message: "Unknown action." };

  try {
    const { caseStudy, wentLive, slugsToRefresh } = await saveCaseStudy(input, intent, { id: user.id, name: user.name });
    // After the response, so saving never waits on the website. (No revalidatePath:
    // it would re-render the open editor and lose in-progress typing.)
    after(() => refreshWebsite(slugsToRefresh, "case-studies"));
    return { ok: true, caseStudy, message: SAVED_MESSAGES[intent](wentLive, caseStudy.status) };
  } catch (error) {
    if (error instanceof CaseStudyError) {
      return { ok: false, message: error.message, fieldErrors: error.fieldErrors, conflict: error.code === "conflict" };
    }
    console.error("Saving case study failed", error);
    return { ok: false, message: "Something went wrong while saving. Your changes are still here; try again." };
  }
}

export async function deleteCaseStudyAction(id: string): Promise<{ ok: false; message: string }> {
  await requireUser();
  try {
    await deleteCaseStudy(id);
  } catch (error) {
    if (error instanceof CaseStudyError) return { ok: false, message: error.message };
    throw error;
  }
  redirect("/case-studies?deleted=1");
}

/** Form action for the ↑/↓ buttons on the list. */
export async function moveCaseStudyAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  try {
    const slugs = await moveCaseStudy(id, direction);
    after(() => refreshWebsite(slugs, "case-studies"));
  } catch (error) {
    if (!(error instanceof CaseStudyError)) throw error;
  }
  redirect("/case-studies");
}

export async function importWebsiteCaseStudiesAction() {
  const user = await requireUser();
  const slugs = await importWebsiteCaseStudies({ id: user.id, name: user.name });
  after(() => refreshWebsite(slugs, "case-studies"));
  redirect(`/case-studies?imported=${slugs.length}`);
}
