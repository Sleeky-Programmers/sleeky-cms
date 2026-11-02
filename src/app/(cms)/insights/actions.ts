"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { ArticleError, deleteArticle, saveArticle, type Article, type SaveIntent } from "@/lib/insights/articles";
import { refreshWebsite } from "@/lib/revalidate";
import { requireUser } from "@/lib/session";
import { findUser } from "@/lib/users";

export type SaveResult =
  | { ok: true; article: Article; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; conflict?: boolean };

const SAVED_MESSAGES: Record<SaveIntent, (wentLive: boolean, status: Article["status"]) => string> = {
  save: (_, status) => (status === "published" ? "Changes are live on the website." : "Draft saved."),
  publish: (wentLive) => (wentLive ? "Published. It's live on the website." : "Changes are live on the website."),
  unpublish: () => "Unpublished. It's back to a draft and no longer on the website.",
};

/** Saves, publishes, updates or unpublishes an article. Any signed-in team member may do all of these. */
export async function saveArticleAction(input: unknown, intent: SaveIntent): Promise<SaveResult> {
  const user = await requireUser();
  if (!["save", "publish", "unpublish"].includes(intent)) return { ok: false, message: "Unknown action." };

  try {
    const { article, wentLive, slugsToRefresh } = await saveArticle(input, intent, { id: user.id, name: user.name }, async (id) => {
      const author = await findUser(id);
      return author && author.active ? { id: author.id, name: author.name } : null;
    });

    // Tell the website after the response is sent, so saving never waits on it.
    // (No revalidatePath here: CMS pages are rendered per request anyway, and
    // revalidating would re-render the open editor and lose in-progress typing.)
    after(() => refreshWebsite(slugsToRefresh));
    return { ok: true, article, message: SAVED_MESSAGES[intent](wentLive, article.status) };
  } catch (error) {
    if (error instanceof ArticleError) {
      return { ok: false, message: error.message, fieldErrors: error.fieldErrors, conflict: error.code === "conflict" };
    }
    console.error("Saving article failed", error);
    return { ok: false, message: "Something went wrong while saving. Your changes are still here; try again." };
  }
}

export async function deleteArticleAction(id: string): Promise<{ ok: false; message: string }> {
  await requireUser();
  try {
    await deleteArticle(id);
  } catch (error) {
    if (error instanceof ArticleError) return { ok: false, message: error.message };
    throw error;
  }
  redirect("/insights?deleted=1");
}
