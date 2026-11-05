"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the server-rendered numbers; also refreshes on its own every minute while the tab is visible. */
export function RefreshButton() {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        const timer = window.setInterval(() => {
            if (document.visibilityState === "visible") startTransition(() => router.refresh());
        }, 60_000);
        return () => window.clearInterval(timer);
    }, [router]);

    return (
        <button
            type="button"
            onClick={() => startTransition(() => router.refresh())}
            disabled={pending}
            className="rounded-full border border-slate px-3 py-1.5 text-xs font-semibold text-soft transition-colors hover:border-green hover:text-white disabled:opacity-50"
        >
            {pending ? "Refreshing…" : "Refresh"}
        </button>
    );
}
