"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button-styles";

export function CopyLink({ link }: { link: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
                readOnly
                value={link}
                aria-label="Invite link"
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 rounded-xl border border-line bg-ink-raised px-3 py-2 text-sm text-soft"
            />
            <button type="button" onClick={copy} className={buttonClass("outline", "sm")}>
                {copied ? "Copied" : "Copy link"}
            </button>
        </div>
    );
}
