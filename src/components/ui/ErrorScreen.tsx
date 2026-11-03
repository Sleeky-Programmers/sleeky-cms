"use client";

import { useEffect } from "react";
import { isOutdatedPage } from "@/lib/outdated-page";
import { buttonClass } from "./button-styles";

/** Error boundary screen: explains an outdated page (after a new deploy) or offers a retry. */
export function ErrorScreen({ error, retry }: { error: unknown; retry: () => void }) {
    const outdated = isOutdatedPage(error);

    useEffect(() => {
        if (!outdated) console.error(error);
    }, [error, outdated]);

    return (
        <div role="alert" className="mx-auto max-w-xl rounded-[28px] border border-line bg-surface p-8 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight">
                {outdated ? "This page is out of date" : "Something went wrong"}
            </h1>
            <p className="mt-3 text-muted">
                {outdated
                    ? "A new version of the CMS was released while this page was open. Reload to continue."
                    : "That didn't work. Try again, and if it keeps happening, reload the page."}
            </p>
            <button type="button" onClick={() => (outdated ? window.location.reload() : retry())} className={`${buttonClass("primary")} mt-6`}>
                {outdated ? "Reload the page" : "Try again"}
            </button>
        </div>
    );
}
