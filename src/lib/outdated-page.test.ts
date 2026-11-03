import { UnrecognizedActionError } from "next/dist/client/components/unrecognized-action-error";
import { describe, expect, it, vi } from "vitest";
import { actionFailureMessage, isOutdatedPage, OUTDATED_PAGE_MESSAGE } from "./outdated-page";

describe("outdated page after a deploy", () => {
  // What Next throws when a page from an older build calls a Server Action.
  const outdated = new UnrecognizedActionError('Server Action "70b7e4" was not found on the server.');

  it("recognises Next's error for an unknown Server Action", () => {
    expect(isOutdatedPage(outdated)).toBe(true);
    expect(isOutdatedPage(new Error("Failed to fetch"))).toBe(false);
  });

  it("asks the editor to save their text and reload", () => {
    expect(actionFailureMessage(outdated)).toBe(OUTDATED_PAGE_MESSAGE);
  });

  it("gives a general message for other failures", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(actionFailureMessage(new Error("Failed to fetch"))).toMatch(/Your changes are still here/);
    log.mockRestore();
  });
});
