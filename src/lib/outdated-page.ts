import { unstable_isUnrecognizedActionError } from "next/navigation";

// Each build gives Server Actions new IDs. A page opened before a new version
// of the CMS was deployed (or before the dev server rebuilt) still uses the old
// ones, and the server answers "Server Action … was not found". That's not a bug
// in the request: the page just needs reloading.

export const OUTDATED_PAGE_MESSAGE =
  "The CMS was updated while this page was open, so this couldn't be saved. Copy any text you haven't saved, then reload the page.";

export const isOutdatedPage = (error: unknown) => unstable_isUnrecognizedActionError(error);

/** Message for an action that threw instead of returning a result. */
export function actionFailureMessage(error: unknown): string {
  if (isOutdatedPage(error)) return OUTDATED_PAGE_MESSAGE;
  console.error(error);
  return "Something went wrong. Your changes are still here; check your connection and try again.";
}
